<?php

namespace App\Enums;

use Filament\Support\Contracts\HasColor;
use Filament\Support\Contracts\HasLabel;

enum TaskType: string implements HasColor, HasLabel
{
    case Simple = 'simple';
    case Complex = 'complex';

    public function getLabel(): string
    {
        return match ($this) {
            self::Simple => 'Simple',
            self::Complex => 'Complex'
        };
    }

    public function getColor(): string|array|null
    {
        return match ($this) {
            self::Simple => 'success',
            self::Complex => 'error',
        };
    }
}
