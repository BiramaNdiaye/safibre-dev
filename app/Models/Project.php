<?php

namespace App\Models;

use App\Enums\ProjectProvider;
use App\Enums\ProjectType;
use App\Services\NanoIdGenerator;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    protected array $guard_name = ['web'];

    protected function casts(): array
    {
        return [
            'type' => ProjectType::class,
            "provider" => ProjectProvider::class
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public static function getForm()
    {
        return [
            Section::make()->schema(
                [
                    TextInput::make('number')
                        ->default(NanoIdGenerator::generate())
                        ->unique(Project::class, ignoreRecord: true)
                        ->disabled()
                        ->maxLength(15)
                        ->dehydrated()
                        ->required(),

                    Select::make("provider")
                        ->enum(ProjectProvider::class)
                        ->options(ProjectProvider::class)
                        ->required(),

                    TextInput::make('ref')
                        ->label('Reference')
                        ->placeholder('PAR-365-23-0015')
                        ->required(),

                    Select::make('type')
                        ->enum(ProjectType::class)
                        ->options(ProjectType::class)
                        ->required(),
                    TextInput::make('name')
                        ->label('Site')
                        ->placeholder('CLINIQUE DES CHAMPS ELYSEES REUILLY')
                        ->required(),

                    Textarea::make('description')->placeholder('Project type description'),
                    Select::make('user_id')
                        ->relationship('user', 'name')
                        ->label('Manager')
                        ->preload()
                        ->searchable()
                        ->required(),
                ]
            )->columns(1),

        ];
    }
}
