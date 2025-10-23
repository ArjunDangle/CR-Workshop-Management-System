import { ALL_WIDGETS, WidgetCard } from '../widgetConfig';

const SafetyDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="text-left">
        <h1 className="text-4xl font-light tracking-tight text-foreground">
          Safety overview
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Monitor safety compliance and incident management
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {ALL_WIDGETS.map((widget) => (
          <WidgetCard key={widget.id} widget={widget} />
        ))}
      </div>
    </div>
  );
};

export default SafetyDashboard;
