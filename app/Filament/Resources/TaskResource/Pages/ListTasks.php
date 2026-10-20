<?php

namespace App\Filament\Resources\TaskResource\Pages;

use App\Enums\TaskName;
use App\Filament\Resources\TaskResource;
use App\Models\Project;
use Filament\Actions;
use Filament\Actions\CreateAction;
use Filament\Notifications\Notification;
use Filament\Resources\Components\Tab;
use Filament\Resources\Pages\ListRecords;

class ListTasks extends ListRecords
{
    protected static string $resource = TaskResource::class;

    public function getTabs(): array
    {
        return [
            null => Tab::make('Tous'),
            'Nouveau' => Tab::make()->query(fn($query) => $query->where('status', 'new')),
            'En attente' => Tab::make()->query(fn($query) => $query->where('status', 'pending')),
            'Terminé' => Tab::make()->query(fn($query) => $query->where('status', 'completed')),
            'Livré' => Tab::make()->query(fn($query) => $query->where('status', 'delivered')),
            'Retourné' => Tab::make()->query(fn($query) => $query->where('status', 'retourned')),

        ];
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make()
                ->before(function (array $data, CreateACtion $action, $livewire) {
                    $project = Project::query()->where('id', $data['project_id'])->first();

                    $hasROPTask = $project->tasks()->where('name', TaskName::ROP->value)->exists();

                    if ($data['name'] === TaskName::BLO->value && ! $hasROPTask) {
                        Notification::make()
                            ->warning()
                            ->title("You must create a ROP before creating a BLO for project {$project->name}")
                            ->icon('heroicon-o-exclamation-circle')
                            ->persistent()
                            ->send();

                        $action->halt();
                    }

                    if ($project->tasks()->where('name', $data['name'])->exists()) {
                        $taskLabel = TaskName::from($data['name'])->getLabel();

                        Notification::make()
                            ->warning()
                            ->title("You cannot create a {$taskLabel} task because it already exists in project {$project->name}")
                            ->icon('heroicon-o-exclamation-circle')
                            ->persistent()
                            ->send();

                        $action->halt();
                    }
                })
                ->slideOver(),
        ];
    }
}
