import { updateAndDelete } from "@/lib/crudRoute";
const { PATCH, DELETE } = updateAndDelete("mentors_sm", { adminOnlyWrite: true });
export { PATCH, DELETE };
