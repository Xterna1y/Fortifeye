export async function linkDependentService(data: any) {
  // create relationship in DB
  return { success: true };
}

export async function suspendService({ dependentId }: any) {
  // update restriction table
  return { success: true, message: "User suspended" };
}

export async function lockFinanceService({ dependentId }: any) {
  return { success: true, message: "Finance locked" };
}