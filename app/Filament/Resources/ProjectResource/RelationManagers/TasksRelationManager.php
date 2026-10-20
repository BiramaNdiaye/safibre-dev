<?php

namespace App\Filament\Resources\ProjectResource\RelationManagers;

use App\Enums\TaskName;
use App\Models\Task;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Actions\CreateAction;
use Filament\Tables\Table;

class TasksRelationManager extends RelationManager
{
    protected static string $relationship = 'tasks';

    public function isReadOnly(): bool
    {
        return false;
    }

    public function form(Form $form): Form
    {

        return $form
            ->schema(Task::getForm($this->getOwnerRecord()->id));
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('type')
            ->columns([
                Tables\Columns\TextColumn::make('type')
                    ->badge()
                    ->searchable(),
                Tables\Columns\TextColumn::make('fci_number')
                    ->label('FCI Number')

                    ->searchable()
                    ->visible(function () {
                        return Task::query()->where('type') === TaskName::BLO->value;
                    }),
                Tables\Columns\TextColumn::make('bpe_number')
                    ->numeric()
                    ->label('BPE Number')
                    ->sortable()
                    ->visible(function () {
                        return Task::query()->where('rop') === TaskName::ROP->value;
                    }),
                Tables\Columns\IconColumn::make('link_terminated')
                    ->boolean()->visible(function () {
                        return Task::query()->where('rop') === TaskName::ROP->value;
                    }),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    // ->description(fn (Task $record) => $record->status_description)->extraAttributes(['class' => 'text-xs'])
                    ->searchable(),

                Tables\Columns\TextColumn::make('status_description')
                    ->label('Description'),

                Tables\Columns\TextColumn::make('start_date')
                    ->date()
                    ->sortable(),
                Tables\Columns\TextColumn::make('end_date')
                    ->date()
                    ->sortable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->headerActions([
                Tables\Actions\CreateAction::make()
                    ->before(function (array $data, CreateACtion $action, RelationManager $livewire) {
                        $project = $livewire->getOwnerRecord();

                        $hasROPTask = $project->tasks()->where('name', TaskName::ROP->value)->exists();

                        if ($data['name'] === TaskName::BLO->value && ! $hasROPTask) {
                            Notification::make()
                                ->warning()
                                ->title('You must create a ROP before creating a BLO')
                                ->icon('heroicon-o-exclamation-circle')
                                ->persistent()
                                ->send();

                            $action->halt();
                        }

                        if ($project->tasks()->where('name', $data['name'])->exists()) {
                            $taskLabel = TaskName::from($data['name'])->getLabel();

                            Notification::make()
                                ->warning()
                                ->title("You cannot create a {$taskLabel} task because it already exists")
                                ->icon('heroicon-o-exclamation-circle')
                                ->persistent()
                                ->send();

                            $action->halt();
                        }
                    }),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }
}
