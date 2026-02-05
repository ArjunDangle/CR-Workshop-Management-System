// Quick export test file to ensure all modules are properly exported
import { getContractors, createContractor, getWorkers, createWorker, validateWorker, Contractor, Worker, ContractorStatus, WorkerSkill, WorkerTrade } from './api';
import ContractorSelect from './components/ContractorSelect';
import WorkerMultiSelect from './components/WorkerMultiSelect';

console.log('All contractor module exports working correctly');

export {
  getContractors,
  createContractor, 
  getWorkers,
  createWorker,
  validateWorker,
  Contractor,
  Worker,
  ContractorStatus,
  WorkerSkill,
  WorkerTrade,
  ContractorSelect,
  WorkerMultiSelect
};