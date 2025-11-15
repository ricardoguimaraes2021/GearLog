<?php

namespace App\Exceptions;

use Exception;

class BusinessRuleException extends Exception
{
    protected $userMessage;
    protected $context;

    public function __construct(string $userMessage, string $technicalMessage = '', array $context = [])
    {
        parent::__construct($technicalMessage ?: $userMessage);
        $this->userMessage = $userMessage;
        $this->context = $context;
    }

    public function getUserMessage(): string
    {
        return $this->userMessage;
    }

    public function getContext(): array
    {
        return $this->context;
    }
}

