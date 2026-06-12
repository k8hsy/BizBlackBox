import { listAndCreate } from "@/lib/crudRoute";
const { GET, POST } = listAndCreate("schedule", { day: 1, order: 1, time: 1 }, { adminOnlyWrite: true });
export { GET, POST };
