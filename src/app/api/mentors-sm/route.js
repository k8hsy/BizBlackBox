import { listAndCreate } from "@/lib/crudRoute";
const { GET, POST } = listAndCreate("mentors_sm", { name: 1 }, { adminOnlyWrite: true });
export { GET, POST };
