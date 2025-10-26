interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i < currentStep
              ? "w-8 bg-gradient-to-r from-blue-600 to-purple-600"
              : i === currentStep
              ? "w-12 bg-gradient-to-r from-blue-600 to-purple-600"
              : "w-8 bg-gray-200"
          }`}
        />
      ))}
      <span className="ml-2 text-sm text-gray-600 font-medium">
        Step {currentStep + 1} of {totalSteps}
      </span>
    </div>
  );
}
