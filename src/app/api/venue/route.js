import { listAndCreate } from "@/lib/crudRoute";
const { GET, POST } = listAndCreate("venue", { floor: 1, name: 1 }, { adminOnlyWrite: true });
export { GET, POST };
