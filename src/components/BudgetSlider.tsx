import { useState } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

interface BudgetSliderProps {
  onBudgetSelect: (min: number, max: number) => void;
}

export function BudgetSlider({ onBudgetSelect }: BudgetSliderProps) {
  const [range, setRange] = useState<[number, number]>([20, 100]);

  const handleChange = (value: number | number[]) => {
    if (Array.isArray(value)) {
      setRange([value[0], value[1]]);
    }
  };

  const handleConfirm = () => {
    onBudgetSelect(range[0], range[1]);
  };

  return (
    <div className="space-y-6">
      <div className="px-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-700">Budget Range</span>
          <span className="text-lg font-bold text-blue-600">
            £{range[0]} - £{range[1]}
          </span>
        </div>
        
        <Slider
          range
          min={5}
          max={500}
          value={range}
          onChange={handleChange}
          trackStyle={[{ backgroundColor: "#2563eb" }]}
          handleStyle={[
            { borderColor: "#2563eb", backgroundColor: "#fff" },
            { borderColor: "#2563eb", backgroundColor: "#fff" },
          ]}
          railStyle={{ backgroundColor: "#e5e7eb" }}
        />
        
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>£5</span>
          <span>£500</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 px-4">
        <button
          onClick={() => setRange([5, 20])}
          className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Under £20
        </button>
        <button
          onClick={() => setRange([20, 50])}
          className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          £20-50
        </button>
        <button
          onClick={() => setRange([50, 100])}
          className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          £50-100
        </button>
        <button
          onClick={() => setRange([100, 200])}
          className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          £100-200
        </button>
      </div>

      <button
        onClick={handleConfirm}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all"
      >
        Continue
      </button>
    </div>
  );
}

