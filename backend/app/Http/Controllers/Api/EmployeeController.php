<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Services\EmployeeService;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Barryvdh\DomPDF\Facade\Pdf;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Employees', description: 'Employee management endpoints')]
class EmployeeController extends Controller
{
    public function __construct(
        protected EmployeeService $employeeService
    ) {
    }

    #[OA\Get(
        path: '/api/v1/employees',
        summary: 'List employees with filters',
        tags: ['Employees'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['active', 'inactive'])),
            new OA\Parameter(name: 'department_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'sort_by', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'sort_order', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['asc', 'desc'])),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated list of employees',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function index(Request $request)
    {
        $request->user()->can('employees.view') || abort(403, 'Unauthorized');

        $query = Employee::with(['department']);

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('employee_code', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        // Filter by department
        if ($request->has('department_id')) {
            $query->where('department_id', $request->get('department_id'));
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $employees = $query->paginate($perPage);

        return response()->json($employees);
    }

    #[OA\Post(
        path: '/api/v1/employees',
        summary: 'Create a new employee',
        tags: ['Employees'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'email', 'position'],
                properties: [
                    new OA\Property(property: 'employee_code', type: 'string', nullable: true),
                    new OA\Property(property: 'name', type: 'string', maxLength: 255),
                    new OA\Property(property: 'email', type: 'string', format: 'email'),
                    new OA\Property(property: 'phone', type: 'string', nullable: true, maxLength: 20),
                    new OA\Property(property: 'department_id', type: 'integer', nullable: true),
                    new OA\Property(property: 'position', type: 'string', maxLength: 255),
                    new OA\Property(property: 'status', type: 'string', enum: ['active', 'inactive'], nullable: true),
                    new OA\Property(property: 'notes', type: 'string', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Employee created successfully'),
            new OA\Response(response: 400, description: 'Business rule violation'),
            new OA\Response(response: 403, description: 'Unauthorized'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(Request $request)
    {
        $request->user()->can('employees.create') || abort(403, 'Unauthorized');

        $validated = $request->validate([
            'employee_code' => 'nullable|string|unique:employees,employee_code',
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees,email',
            'phone' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^[\d\s\+\-\(\)]+$/',
            ],
            'department_id' => 'nullable|exists:departments,id',
            'position' => 'required|string|max:255',
            'status' => 'sometimes|in:active,inactive',
            'notes' => 'nullable|string',
        ]);

        try {
            $employee = $this->employeeService->createEmployee($validated);
            return response()->json($employee->load('department'), 201);
        } catch (BusinessRuleException $e) {
            return response()->json([
                'error' => $e->getUserMessage(),
                'context' => $e->getContext(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An unexpected error occurred while creating the employee.',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    #[OA\Get(
        path: '/api/v1/employees/{id}',
        summary: 'Get employee details',
        tags: ['Employees'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Employee details with assignments and tickets',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function show(Request $request, Employee $employee)
    {
        $request->user()->can('employees.view') || abort(403, 'Unauthorized');

        $employee->load([
            'department',
            'activeAssignments.product.category',
            'assignments.product.category',
            'assignments.assignedBy',
            'assignments.returnedBy',
            'logs.user',
        ]);

        return response()->json($employee);
    }

    #[OA\Put(
        path: '/api/v1/employees/{id}',
        summary: 'Update an employee',
        tags: ['Employees'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string', maxLength: 255),
                    new OA\Property(property: 'email', type: 'string', format: 'email'),
                    new OA\Property(property: 'phone', type: 'string', nullable: true),
                    new OA\Property(property: 'department_id', type: 'integer', nullable: true),
                    new OA\Property(property: 'position', type: 'string', maxLength: 255),
                    new OA\Property(property: 'status', type: 'string', enum: ['active', 'inactive']),
                    new OA\Property(property: 'notes', type: 'string', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Employee updated successfully'),
            new OA\Response(response: 400, description: 'Business rule violation'),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function update(Request $request, Employee $employee)
    {
        $request->user()->can('employees.update') || abort(403, 'Unauthorized');

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:employees,email,' . $employee->id,
            'phone' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^[\d\s\+\-\(\)]+$/',
            ],
            'department_id' => 'nullable|exists:departments,id',
            'position' => 'sometimes|required|string|max:255',
            'status' => 'sometimes|in:active,inactive',
            'notes' => 'nullable|string',
        ]);

        try {
            $employee = $this->employeeService->updateEmployee($employee, $validated);
            return response()->json($employee->load('department'));
        } catch (BusinessRuleException $e) {
            return response()->json([
                'error' => $e->getUserMessage(),
                'context' => $e->getContext(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An unexpected error occurred while updating the employee.',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    #[OA\Delete(
        path: '/api/v1/employees/{id}',
        summary: 'Delete an employee',
        tags: ['Employees'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Employee deleted successfully'),
            new OA\Response(response: 400, description: 'Business rule violation'),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function destroy(Request $request, Employee $employee)
    {
        $request->user()->can('employees.delete') || abort(403, 'Unauthorized');

        try {
            $this->employeeService->deleteEmployee($employee);
            return response()->json(['message' => 'Employee deleted successfully']);
        } catch (BusinessRuleException $e) {
            return response()->json([
                'error' => $e->getUserMessage(),
                'context' => $e->getContext(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An unexpected error occurred while deleting the employee.',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    #[OA\Post(
        path: '/api/v1/employees/{id}/deactivate',
        summary: 'Deactivate an employee',
        tags: ['Employees'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Employee deactivated successfully'),
            new OA\Response(response: 400, description: 'Business rule violation'),
        ]
    )]
    public function deactivate(Employee $employee)
    {
        try {
            $employee = $this->employeeService->deactivateEmployee($employee);
            return response()->json($employee->load('department'));
        } catch (BusinessRuleException $e) {
            return response()->json([
                'error' => $e->getUserMessage(),
                'context' => $e->getContext(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An unexpected error occurred while deactivating the employee.',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    #[OA\Post(
        path: '/api/v1/employees/{id}/reactivate',
        summary: 'Reactivate an employee',
        tags: ['Employees'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Employee reactivated successfully'),
            new OA\Response(response: 400, description: 'Business rule violation'),
        ]
    )]
    public function reactivate(Employee $employee)
    {
        try {
            $employee = $this->employeeService->reactivateEmployee($employee);
            return response()->json($employee->load('department'));
        } catch (BusinessRuleException $e) {
            return response()->json([
                'error' => $e->getUserMessage(),
                'context' => $e->getContext(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An unexpected error occurred while reactivating the employee.',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    #[OA\Get(
        path: '/api/v1/employees/export/{format}',
        summary: 'Export employees to CSV, Excel, or PDF',
        tags: ['Employees'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'format', in: 'path', required: true, schema: new OA\Schema(type: 'string', enum: ['csv', 'excel', 'pdf'])),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'department_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Export file'),
            new OA\Response(response: 400, description: 'Invalid format'),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function export(Request $request, string $format)
    {
        $request->user()->can('employees.view') || abort(403, 'Unauthorized');

        // Apply same filters as index
        $query = Employee::with('department');

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('employee_code', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%");
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->get('department_id'));
        }

        $employees = $query->get();

        switch ($format) {
            case 'csv':
                return $this->exportCsv($employees);
            case 'excel':
                return $this->exportExcel($employees);
            case 'pdf':
                return $this->exportPdf($employees);
            default:
                return response()->json(['error' => 'Invalid format'], 400);
        }
    }

    protected function exportCsv($employees)
    {
        $filename = 'employees_' . now()->format('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($employees) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID', 'Employee Code', 'Name', 'Email', 'Phone', 'Department', 'Position', 'Status']);

            foreach ($employees as $employee) {
                fputcsv($file, [
                    $employee->id,
                    $employee->employee_code,
                    $employee->name,
                    $employee->email,
                    $employee->phone ?? '',
                    $employee->department->name ?? '',
                    $employee->position,
                    $employee->status,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    protected function exportExcel($employees)
    {
        $export = new class($employees) implements FromCollection, WithHeadings, WithMapping {
            protected $employees;

            public function __construct($employees)
            {
                $this->employees = $employees;
            }

            public function collection()
            {
                return $this->employees->load('department');
            }

            public function headings(): array
            {
                return [
                    'ID',
                    'Employee Code',
                    'Name',
                    'Email',
                    'Phone',
                    'Department',
                    'Position',
                    'Status',
                    'Notes',
                ];
            }

            public function map($employee): array
            {
                return [
                    $employee->id,
                    $employee->employee_code,
                    $employee->name,
                    $employee->email,
                    $employee->phone ?? '',
                    $employee->department->name ?? '',
                    $employee->position,
                    $employee->status,
                    $employee->notes ?? '',
                ];
            }
        };

        $filename = 'employees_' . now()->format('Y-m-d_His') . '.xlsx';
        return Excel::download($export, $filename);
    }

    protected function exportPdf($employees)
    {
        $employees = $employees->load('department');
        $pdf = Pdf::loadView('exports.employees', [
            'employees' => $employees,
            'date' => now()->format('Y-m-d H:i:s'),
        ]);

        $filename = 'employees_' . now()->format('Y-m-d_His') . '.pdf';
        return $pdf->download($filename);
    }
}
