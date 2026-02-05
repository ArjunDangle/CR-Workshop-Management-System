// client/src/modules/contractor/components/WorkerMultiSelect.tsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, X, Users, AlertTriangle, Loader2, User, Shield, ShieldAlert } from 'lucide-react';

import { getWorkers, Worker, WorkerSkill, WorkerTrade } from '../api';

// Shadcn UI Components
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface WorkerMultiSelectProps {
  contractorId?: string;
  selectedWorkerIds: string[];
  onChange: (workerIds: string[], workers: Worker[]) => void;
  disabled?: boolean;
  maxVisibleWorkers?: number;
}

const WorkerMultiSelect: React.FC<WorkerMultiSelectProps> = ({
  contractorId,
  selectedWorkerIds,
  onChange,
  disabled = false,
  maxVisibleWorkers = 10,
}) => {
  const { data: workers = [], isLoading, error } = useQuery({
    queryKey: ['contractor-workers', contractorId],
    queryFn: () => getWorkers(contractorId!),
    enabled: !!contractorId && !disabled,
  });

  const isMedicalExpired = (medicalValidUpto: string) => {
    const expiryDate = new Date(medicalValidUpto);
    const today = new Date();
    return expiryDate < today;
  };

  const isTrainingExpired = (trainingValidUpto: string) => {
    const expiryDate = new Date(trainingValidUpto);
    const today = new Date();
    return expiryDate < today;
  };

  const isWorkerEligible = (worker: Worker) => {
    return !worker.is_blacklisted && 
           !isMedicalExpired(worker.medical_valid_upto) && 
           !isTrainingExpired(worker.safety_training_valid_upto);
  };

  const getWorkerSafetyStatus = (worker: Worker) => {
    if (worker.is_blacklisted) return { status: 'blacklisted', color: 'red', icon: ShieldAlert, message: 'Blacklisted' };
    if (isMedicalExpired(worker.medical_valid_upto)) return { status: 'medical-expired', color: 'red', icon: AlertTriangle, message: '⚠️ Medical Expired' };
    if (isTrainingExpired(worker.safety_training_valid_upto)) return { status: 'training-expired', color: 'yellow', icon: AlertTriangle, message: '⚠️ Training Expired' };
    return { status: 'safe', color: 'green', icon: Shield, message: 'Safe' };
  };

  const getSkillColor = (skill: WorkerSkill) => {
    switch (skill) {
      case WorkerSkill.SPECIALIST: return 'bg-purple-100 text-purple-800';
      case WorkerSkill.SKILLED: return 'bg-blue-100 text-blue-800';
      case WorkerSkill.SEMI_SKILLED: return 'bg-yellow-100 text-yellow-800';
      case WorkerSkill.UNSKILLED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTradeColor = (trade: WorkerTrade) => {
    switch (trade) {
      case WorkerTrade.ELECTRICIAN: return 'bg-red-100 text-red-800';
      case WorkerTrade.FITTER: return 'bg-green-100 text-green-800';
      case WorkerTrade.WELDER: return 'bg-orange-100 text-orange-800';
      case WorkerTrade.RIGGER: return 'bg-blue-100 text-blue-800';
      case WorkerTrade.HELPER: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleWorkerToggle = (workerId: string, worker: Worker) => {
    if (!isWorkerEligible(worker)) return;

    const isSelected = selectedWorkerIds.includes(workerId);
    let newSelectedIds: string[];
    
    if (isSelected) {
      newSelectedIds = selectedWorkerIds.filter(id => id !== workerId);
    } else {
      newSelectedIds = [...selectedWorkerIds, workerId];
    }

    const selectedWorkers = workers.filter(w => newSelectedIds.includes(w.id));
    onChange(newSelectedIds, selectedWorkers);
  };

  const selectedWorkers = workers.filter(w => selectedWorkerIds.includes(w.id));

  if (!contractorId) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-gray-500">
            <Users className="h-8 w-8 mr-2" />
            <span>Please select a contractor first to view available workers</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-red-600">
            <AlertTriangle className="h-8 w-8 mr-2" />
            <span>Failed to load workers</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected Workers Summary */}
      {selectedWorkers.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Selected Workers ({selectedWorkers.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedWorkers.map((worker) => {
                const safetyStatus = getWorkerSafetyStatus(worker);
                const StatusIcon = safetyStatus.icon;
                return (
                  <div
                    key={worker.id}
                    className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-blue-200"
                  >
                    <StatusIcon className={cn(
                      "h-3 w-3",
                      safetyStatus.color === 'green' && "text-green-600",
                      safetyStatus.color === 'red' && "text-red-600",
                      safetyStatus.color === 'yellow' && "text-yellow-600"
                    )} />
                    <span className="text-sm font-medium">{worker.full_name}</span>
                    <button
                      onClick={() => handleWorkerToggle(worker.id, worker)}
                      className="text-gray-400 hover:text-red-600 ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workers List */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="font-medium">Available Workers</span>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            {workers.length > 0 && (
              <span className="text-sm text-gray-500">{workers.length} workers found</span>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading workers...
            </div>
          ) : workers.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <User className="h-8 w-8 mr-2" />
              <span>No workers found for this contractor</span>
            </div>
          ) : (
            <ScrollArea className={`h-[${Math.min(workers.length * 80, 400)}px]`}>
              <div className="space-y-2">
                {workers.map((worker) => {
                  const isSelected = selectedWorkerIds.includes(worker.id);
                  const isEligible = isWorkerEligible(worker);
                  const safetyStatus = getWorkerSafetyStatus(worker);
                  const StatusIcon = safetyStatus.icon;

                  return (
                    <div
                      key={worker.id}
                      className={cn(
                        "p-3 border rounded-lg transition-all duration-200",
                        isSelected && "border-blue-300 bg-blue-50",
                        !isEligible && "border-red-200 bg-red-50 opacity-75",
                        isEligible && !isSelected && "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`worker-${worker.id}`}
                          checked={isSelected}
                          onCheckedChange={() => handleWorkerToggle(worker.id, worker)}
                          disabled={!isEligible || disabled}
                          className={cn(
                            "mt-1",
                            !isEligible && "cursor-not-allowed opacity-50"
                          )}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <label
                              htmlFor={`worker-${worker.id}`}
                              className={cn(
                                "font-medium text-sm cursor-pointer",
                                !isEligible && "cursor-not-allowed text-gray-500",
                                isEligible && !isSelected && "cursor-pointer",
                                isSelected && "text-blue-700"
                              )}
                            >
                              {worker.full_name}
                            </label>
                            <StatusIcon className={cn(
                              "h-4 w-4",
                              safetyStatus.color === 'green' && "text-green-600",
                              safetyStatus.color === 'red' && "text-red-600",
                              safetyStatus.color === 'yellow' && "text-yellow-600"
                            )} />
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {worker.id_proof_number}
                            </Badge>
                            <Badge className={cn("text-xs", getSkillColor(worker.skill_category))}>
                              {worker.skill_category.replace('_', ' ')}
                            </Badge>
                            <Badge className={cn("text-xs", getTradeColor(worker.trade))}>
                              {worker.trade}
                            </Badge>
                          </div>

                          <div className="text-xs text-gray-600 space-y-1">
                            <div>Medical: {new Date(worker.medical_valid_upto).toLocaleDateString()}</div>
                            <div>Training: {new Date(worker.safety_training_valid_upto).toLocaleDateString()}</div>
                            {worker.is_blacklisted && (
                              <div className="text-red-600 font-medium">⚠️ BLACKLISTED</div>
                            )}
                            {!isEligible && !worker.is_blacklisted && (
                              <div className="text-red-600 font-medium">{safetyStatus.message}</div>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="h-5 w-5 text-blue-600 mt-1" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkerMultiSelect;