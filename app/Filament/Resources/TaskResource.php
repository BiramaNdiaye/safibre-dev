<?php

namespace App\Filament\Resources;

use App\Enums\TaskName;
use App\Filament\Resources\TaskResource\Pages;
use App\Models\Task;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class TaskResource extends Resource
{
    protected static ?string $model = Task::class;

    protected static ?string $navigationGroup = 'Management';

    protected static ?string $navigationIcon = 'heroicon-o-rectangle-stack';

    public static function form(Form $form): Form
    {
        return $form
            ->schema(Task::getForm());
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->badge()
                    ->searchable(),
                Tables\Columns\TextColumn::make('type')
                    ->badge()->color('gray'),
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
                Tables\Columns\TextColumn::make('project.name')
                    ->numeric()
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
                SelectFilter::make('type')->options(TaskName::class),
            ])
            ->actions([
                Tables\Actions\EditAction::make()->slideOver(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListTasks::route('/'),
            // 'create' => Pages\CreateTask::route('/create'),
            // 'edit' => Pages\EditTask::route('/{record}/edit'),
        ];
    }
}
