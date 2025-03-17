export const validateGroupId = (groupId: string | undefined): boolean => {
  if (!groupId) return false;
  
  // Basic validation - adjust according to your group ID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(groupId);
}; 