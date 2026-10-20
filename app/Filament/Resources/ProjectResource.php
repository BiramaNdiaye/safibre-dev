<?php

namespace App\Filament\Resources;

use App\Enums\ProjectProvider;
use App\Enums\ProjectType;
use App\Filament\Exports\ProjectExporter;
use App\Filament\Resources\ProjectResource\Pages;
use App\Filament\Resources\ProjectResource\RelationManagers\TasksRelationManager;
use App\Filament\Resources\ProjectResource\Widgets\ProjectChartWidget;
use App\Models\Project;
use Filament\Forms\Form;
use Filament\Infolists\Components\Section;
use Filament\Infolists\Components\TextEntry;
use Filament\Infolists\Infolist;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Actions\ExportAction;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class ProjectResource extends Resource
{
    protected static ?string $model = Project::class;

    protected static ?string $navigationIcon = 'heroicon-o-rectangle-stack';

    protected static ?string $navigationGroup = 'Management';

    public static function form(Form $form): Form
    {
        return $form
            ->schema(Project::getForm());
    }

    public static function table(Table $table): Table
    {

        return $table
            ->columns([
                Tables\Columns\TextColumn::make('ref')
                    ->label('Ref')
                    ->searchable(),
                Tables\Columns\TextColumn::make('number'),
                Tables\Columns\TextColumn::make('type')
                    ->badge()->default(ProjectType::Prod->value),
                Tables\Columns\TextColumn::make('name')
                    ->label('Site')
                    ->description(fn(Project $record) => $record->description)
                    ->searchable(),
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Manager')
                    ->numeric(),
            ])
            ->filters([
                SelectFilter::make('type')->options(ProjectType::class),
                SelectFilter::make("provider")->options(ProjectProvider::class),
                SelectFilter::make('user')
                    ->label('Project Manager')
                    ->relationship('user', 'name')
                    ->multiple()
                    ->searchable()
                    ->preload(),
            ])
            ->persistFiltersInSession()
            ->filtersTriggerAction(function (Action $action) {
                return $action->button()->label("Filters");
            })
            ->actions([
                Tables\Actions\ViewAction::make()->slideOver(),
                Tables\Actions\EditAction::make()
                    ->slideOver(),
            ])
            ->headerActions([
                ExportAction::make()
                    ->exporter(ProjectExporter::class)
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function infolist(Infolist $infolist): Infolist
    {
        return $infolist->schema([
            Section::make('Project details')->schema([
                TextEntry::make('number')->badge()->color('gray'),
                TextEntry::make('ref')->badge()->color('gray'),
                TextEntry::make('name'),
                TextEntry::make('type')->badge(),
                TextEntry::make('user.name')->label('Project Manager'),
            ]),
        ]);
    }

    public static function getRelations(): array
    {
        return [
            TasksRelationManager::class,
        ];
    }

    public static function getWidgets(): array
    {
        return [
            ProjectChartWidget::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListProjects::route('/'),
            'view' => Pages\ViewProject::route('/{record}'),
            // 'create' => Pages\CreateProject::route('/create'),
            // 'edit' => Pages\EditProject::route('/{record}/edit'),
        ];
    }
}
