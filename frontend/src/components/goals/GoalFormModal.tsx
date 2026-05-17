"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateGoal, useUpdateGoal, useThrustAreas } from "@/hooks/useGoals";
import { Goal, UnitOfMeasurement } from "@/types/models";
import { getErrorMessage } from "@/lib/utils";
import { X } from "lucide-react";

const goalSchema = z.object({
  thrust_area_id: z.string().min(1, "Thrust area is required"),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  unit_of_measurement: z.nativeEnum(UnitOfMeasurement),
  target: z.number({ invalid_type_error: "Target must be a number" }).min(0, "Target cannot be negative"),
  weightage: z.number({ invalid_type_error: "Weightage must be a number" }).min(10, "Min 10%").max(100, "Max 100%"),
});

type GoalFormData = z.infer<typeof goalSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingGoal?: Goal | null;
  currentWeightage: number;
  maxGoals: number;
  currentCount: number;
}

export default function GoalFormModal({ isOpen, onClose, editingGoal, currentWeightage }: Props) {
  const { data: thrustAreas = [] } = useThrustAreas();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal(editingGoal?.id ?? "");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: editingGoal
      ? {
          thrust_area_id: editingGoal.thrust_area_id,
          title: editingGoal.title,
          description: editingGoal.description ?? "",
          unit_of_measurement: editingGoal.unit_of_measurement,
          target: editingGoal.target,
          weightage: editingGoal.weightage,
        }
      : undefined,
  });

  useEffect(() => {
    if (editingGoal) {
      reset({
        thrust_area_id: editingGoal.thrust_area_id,
        title: editingGoal.title,
        description: editingGoal.description ?? "",
        unit_of_measurement: editingGoal.unit_of_measurement,
        target: editingGoal.target,
        weightage: editingGoal.weightage,
      });
    } else {
      reset({});
    }
  }, [editingGoal, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: GoalFormData) => {
    try {
      if (editingGoal) {
        await updateGoal.mutateAsync(data);
      } else {
        await createGoal.mutateAsync(data);
      }
      onClose();
    } catch (e) {
      // error shown in UI
    }
  };

  const mutationError = editingGoal ? updateGoal.error : createGoal.error;
  const isPending = editingGoal ? updateGoal.isPending : createGoal.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingGoal ? "Edit Goal" : "Create New Goal"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thrust Area</label>
            <select
              {...register("thrust_area_id")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="">Select thrust area...</option>
              {thrustAreas.map((ta) => (
                <option key={ta.id} value={ta.id}>{ta.name}</option>
              ))}
            </select>
            {errors.thrust_area_id && <p className="mt-1 text-xs text-red-600">{errors.thrust_area_id.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
            <input
              {...register("title")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="e.g., Improve customer satisfaction score"
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400">(optional)</span></label>
            <textarea
              {...register("description")}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measurement</label>
              <select
                {...register("unit_of_measurement")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              >
                {Object.values(UnitOfMeasurement).map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              {errors.unit_of_measurement && <p className="mt-1 text-xs text-red-600">{errors.unit_of_measurement.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
              <input
                {...register("target", { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
              {errors.target && <p className="mt-1 text-xs text-red-600">{errors.target.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weightage (%)
              <span className="ml-2 text-xs text-gray-400">Current total: {currentWeightage}%</span>
            </label>
            <input
              {...register("weightage", { valueAsNumber: true })}
              type="number"
              min="10"
              max="100"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            {errors.weightage && <p className="mt-1 text-xs text-red-600">{errors.weightage.message}</p>}
          </div>

          {mutationError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{getErrorMessage(mutationError)}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition"
            >
              {isPending ? "Saving..." : editingGoal ? "Update Goal" : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
