<?php

namespace App\Filament\Resources\ProjectResource\Widgets;

use App\Enums\TaskName;
use App\Enums\TaskStatus;
use Illuminate\Database\Eloquent\Builder;

use App\Models\Project;
use Doctrine\DBAL\Query;
use Filament\Widgets\ChartWidget;
use Flowframe\Trend\Trend;
use Flowframe\Trend\TrendValue;

class ProjectChartWidget extends ChartWidget
{
    protected static ?string $heading = 'Project Completions';

    protected int | string | array $columnSpan = 'full';
    protected static ?string $maxHeight = "200px";

    protected function getFilters(): ?array
    {
        return parent::getFilters();
    }

    protected function getData(): array
    {
        $projectTrendQuery = Project::query()
            ->whereHas('tasks', function (Builder $query) {
                $query->where('name', TaskName::ROP)
                    ->whereNotNull('end_date')
                    ->where('status', TaskStatus::Delivered);
            })
            ->whereHas('tasks', function (Builder $query) {
                $query->where('name', TaskName::BLO)
                    ->whereNotNull('end_date')
                    ->where('status', TaskStatus::Delivered);
            });
        $data = Trend::query($projectTrendQuery)
            ->between(start: now()->startOfYear(), end: now()->endOfYear())
            ->perMonth()
            ->count();


        return [
            'datasets' => [
                [
                    'label' => 'Completed Projects',
                    'data' => $data->map(fn(TrendValue $value) => $value->aggregate),
                ],
            ],
            'labels' => $data->map(fn(TrendValue $value) => $value->date),
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }
}
