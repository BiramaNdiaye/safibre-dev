<?php

namespace App\Models;

use App\Enums\StatusDescription;
use App\Enums\TaskName;
use App\Enums\TaskStatus;
use App\Enums\TaskType;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\ToggleButtons;
use Filament\Forms\Get;
use Filament\Forms\Set;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    use HasFactory;

    protected array $guard_name = ['web'];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'id' => 'integer',
        'name' => TaskName::class,
        'type' => TaskType::class,
        'status' => TaskStatus::class,
        'link_terminated' => 'boolean',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'project_id' => 'integer',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public static function getForm($projectId = null): array
    {
        return [
            Section::make()->schema([
                Select::make('name')
                    ->live()
                    ->enum(TaskName::class)
                    ->options(function ($record) {
                        return TaskName::class;
                    })
                    ->required(),

                Select::make('type')
                    ->live()
                    ->enum(TaskType::class)
                    ->options(TaskType::class)
                    ->required(),

                TextInput::make('fci_number')
                    ->label('FCI Number')
                    ->hidden(fn(Get $get) => $get('name') === TaskName::ROP->value),

                TextInput::make('bpe_number')
                    ->required(fn(Get $get): bool => $get('type') === TaskType::Complex->value)
                    ->label('BPE Number')
                    ->hidden(fn(Get $get): bool => $get('name') === TaskName::BLO->value)
                    ->numeric(),

                ToggleButtons::make('status')
                    ->live()
                    ->inline()
                    ->options(TaskStatus::class)
                    ->required(),

                Select::make("status_description")
                    ->live()
                    ->disabled(function (Get $get) {
                        return (bool) !$get("name") && (bool) !$get("status");
                    })
                    ->options(function (Get $get) {
                        if ($get("status") && $get("name")) {
                            return TaskStatus::from($get("status"))->description(TaskName::from($get("name")), TaskStatus::from($get("status")));
                        }
                    }),

                DatePicker::make('start_date')
                    ->native(false)
                    ->required(),
                DatePicker::make('end_date')
                    ->native(false)
                    ->required(),
                Toggle::make('link_terminated')
                    ->hidden(fn(Get $get) => $get('name') === TaskName::BLO->value),

                Select::make('project_id')
                    ->hidden(function () use ($projectId) {
                        return $projectId !== null;
                    })
                    ->required()
                    ->preload()
                    ->relationship('project', 'name')
                    ->searchable(["ref", "name"]),
            ]),
        ];
    }
}
