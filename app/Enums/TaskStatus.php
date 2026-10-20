<?php

namespace App\Enums;

use Filament\Support\Contracts\HasColor;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;




enum TaskStatus: string implements HasColor, HasIcon, HasLabel
{
    case New = 'new';
    case Pending = 'pending';
    case Completed = 'completed';
    case Delivered = 'delivered';
    case Returned = 'returned';

    public function getColor(): string|array|null
    {
        return match ($this) {
            self::New => 'info',
            self::Pending => 'warning',
            self::Completed => 'success',
            self::Delivered => 'success',
            self::Returned => 'danger'
        };
    }

    public function getLabel(): ?string
    {
        return match ($this) {
            self::New => 'Nouveau',
            self::Pending => 'En attente',
            self::Completed => 'Terminé',
            self::Delivered => 'Livré',
            self::Returned => 'Retourné'
        };
    }

    public function description(TaskName $taskName, TaskStatus $taskStatus): array
    {

        if ($taskName === TaskName::ROP || $taskName === TaskName::BLO) {
            return match ($taskName) {
                TaskName::ROP => match ($taskStatus) {
                    TaskStatus::New => ['En cours de traitement'],

                    TaskStatus::Completed =>     [
                        'Date intégration retour terrain OK',
                        'Traité',
                        'Livré',
                    ],
                    TaskStatus::Pending => [
                        'Attente info sup',
                        'Attente Validation Syno',
                        'Attente Validation lien resilie',
                        'Pop sature',
                        'Cable sature',
                    ],
                    TaskStatus::Returned => [
                        "PROD V2",
                        "PROD V3"
                    ],

                    TaskStatus::Delivered => [
                        'Date intégration retour terrain OK',
                        'Traité',
                        'Livré',
                    ],
                    default => throw new \UnhandledMatchError("Unhandled task status: " . $taskStatus),
                },

                TaskName::BLO => match ($taskStatus) {

                    TaskStatus::New => ['En cours de traitement'],
                    TaskStatus::Pending => [
                        'Dépôt WEBOP-V1',
                        'Dépôt WEBOP-V2',
                        'Dépôt WEBOP-V3',
                        'Dépôt WEBOP-C3A',
                    ],
                    TaskStatus::Delivered => [
                        'Retour WEBOP-V1 OK',
                        'Retour WEBOP-V2 OK',
                        'Retour WEBOP-V3 OK',
                    ],
                    TaskStatus::Completed => [
                        'Dépôt ANNX sur WT',
                    ],
                    TaskStatus::Returned => [
                        'Retour WEBOP-V1 NOK',
                        'Retour WEBOP-V2 NOK',
                        'Retour WEBOP-V3 NOK',
                    ],
                    default => throw new \UnhandledMatchError("Unhandled task status: " . $taskStatus),
                },
            };
        }

        return [];
    }

    public function getDescription(TaskName $taskName): string
    {
        return match ($this) {
            self::New => 'En cours de traitement',

            self::Pending => match ($taskName) {
                TaskName::ROP => 'Attente info sup, attente validatation syno,attente validation lien resilié,pop saturé, Câble saturé',
                TaskName::BLO => 'Dépôt WEBOP-V1, Dépôt WEBOP-V2, Dépôt WEBOP-V3, Dépôt WEBOP-C3A',
                TaskName::DOE => "",
                TaskName::PATATOIDE => ""
            },
            self::Completed => match ($taskName) {
                TaskName::ROP => "Date intégration retour terrain OK",
                TaskName::BLO => 'Dépôt ANNX sur WT',
                TaskName::DOE => "",
                TaskName::PATATOIDE => ""
            },
            self::Delivered => match ($taskName) {
                TaskName::ROP => 'Livré',
                TaskName::BLO => 'Retour WEBOP-V1 OK, Retour WEBOP-V2 OK, Retour WEBOP-V3 OK',
                TaskName::DOE => "",
                TaskName::PATATOIDE => ""
            },
            self::Returned => match ($taskName) {
                TaskName::BLO => "Retour WEBOP-V1 NOK, Retour WEBOP-V2 NOK, Retour WEBOP-V3 NOK",
                TaskName::ROP => 'Prod V2, prod V3',
                TaskName::DOE => "",
                TaskName::PATATOIDE => ""
            }
        };
    }

    public function getIcon(): ?string
    {
        return match ($this) {
            self::New => 'heroicon-m-sparkles',
            self::Pending => 'heroicon-m-arrow-path',
            self::Completed => 'heroicon-m-check-badge',
            self::Delivered => 'heroicon-m-truck',
            self::Returned => 'heroicon-m-x-circle',
        };
    }
}
