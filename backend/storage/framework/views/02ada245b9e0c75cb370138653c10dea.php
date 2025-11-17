<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Products Export - GearLog</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .footer {
            margin-top: 30px;
            font-size: 10px;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <h1>Products Export - GearLog</h1>
    <p><strong>Generated:</strong> <?php echo e($date); ?></p>
    <p><strong>Total Products:</strong> <?php echo e($products->count()); ?></p>

    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Model</th>
                <th>Serial Number</th>
                <th>Status</th>
                <th>Quantity</th>
                <th>Value</th>
            </tr>
        </thead>
        <tbody>
            <?php $__currentLoopData = $products; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $product): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <tr>
                <td><?php echo e($product->id); ?></td>
                <td><?php echo e($product->name); ?></td>
                <td><?php echo e($product->category->name ?? '-'); ?></td>
                <td><?php echo e($product->brand ?? '-'); ?></td>
                <td><?php echo e($product->model ?? '-'); ?></td>
                <td><?php echo e($product->serial_number ?? '-'); ?></td>
                <td><?php echo e(ucfirst($product->status)); ?></td>
                <td><?php echo e($product->quantity); ?></td>
                <td><?php echo e($product->value ? '€' . number_format($product->value, 2) : '-'); ?></td>
            </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
        </tbody>
    </table>

    <div class="footer">
        <p>GearLog - IT Equipment Inventory Management System</p>
    </div>
</body>
</html>

<?php /**PATH /Users/local/Documents/GearLog/backend/resources/views/exports/products.blade.php ENDPATH**/ ?>