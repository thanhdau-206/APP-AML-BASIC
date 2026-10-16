import { baseConfig, Company } from './baseConfig.ts';
import { companyA } from './companies/companyA.ts';
import { companyB } from './companies/companyB.ts';
import { companyC } from './companies/companyC.ts';
import { companyD } from './companies/companyD.ts';
import { companyE } from './companies/companyE.ts';
import { companyF } from './companies/companyF.ts';
import { companyG } from './companies/companyG.ts';
import { companyH } from './companies/companyH.ts';

export const companies: Company[] = [
  companyA,
  companyB,
  companyC,
  companyD,
  companyE,
  companyF,
  companyG,
  companyH
];

export const duLieuApp = {
  ghi_chu: baseConfig.ghi_chu,
  config: baseConfig.config,
  steps: baseConfig.steps,
  ref: baseConfig.ref,
  preview_columns: baseConfig.preview_columns,
  companies
};

export type AppData = typeof duLieuApp;
export * from './baseConfig.ts';
