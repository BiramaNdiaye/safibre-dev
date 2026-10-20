<?php

namespace App\Enums;

use Filament\Support\Contracts\HasLabel;

enum ProjectType: string implements HasLabel
{
    case Prod = 'prod';

    public function getLabel(): string
    {
        return match ($this) {
            self::Prod => 'PROD'
        };
    }
}
