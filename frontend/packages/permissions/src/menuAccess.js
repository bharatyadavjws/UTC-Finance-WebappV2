import { PERMISSIONS } from './permissions'

export const ROLES = {
    AGENT: 'agent',
    INVESTOR: 'investor',
    UTC_TEAM: 'utc_team',
    RETAILER: 'retailer',
  };

export const AGENT_MENU_ACCESS = {
  dashboard: [PERMISSIONS.VIEW_AGENT_DASHBOARD],
  retailers: [PERMISSIONS.VIEW_OWN_RETAILERS],
  loans: [PERMISSIONS.VIEW_OWN_LOANS],
  emiCalculator: [PERMISSIONS.USE_EMI_CALCULATOR],
  eligibility: [PERMISSIONS.VIEW_OWN_LOANS], 
}

export const CRM_MENU_ACCESS = {
  dashboard: [PERMISSIONS.VIEW_CRM_DASHBOARD],
  retailers: [PERMISSIONS.VIEW_ALL_RETAILERS],
  loans: [PERMISSIONS.VIEW_ALL_LOANS],
  users: [PERMISSIONS.VIEW_USERS],
}