import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Sem globais do Vitest, o RTL não se limpa sozinho: desmonta os ecrãs entre testes.
afterEach(cleanup);

// O jsdom não implementa scrollTo: simula-o para os ecrãs que levam a vista ao topo.
window.scrollTo = vi.fn() as typeof window.scrollTo;
