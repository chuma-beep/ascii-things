import { createRenderer, defineComponent, h, nextTick, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import type { SceneHandle, SceneOptions, SceneStats } from "../core/scene";
import { createSceneComponent } from "./create-scene";

interface HostNode {
  tag?: string;
  text?: string;
  children: HostNode[];
  parent: HostNode | null;
}

const stats: SceneStats = {
  fps: 60,
  frameMs: 16,
  cells: 0,
  columns: 0,
  rows: 0,
};

function fakeHandle(): SceneHandle {
  return {
    pause: vi.fn(),
    resume: vi.fn(),
    resize: vi.fn(),
    setOptions: vi.fn(),
    trigger: vi.fn(),
    getStats: () => stats,
    destroy: vi.fn(),
  } as unknown as SceneHandle;
}

function makeRenderer() {
  const ops = {
    createElement: (tag: string): HostNode => ({ tag, children: [], parent: null }),
    insert: (child: HostNode, parent: HostNode): void => {
      child.parent = parent;
      parent.children.push(child);
    },
    remove: (child: HostNode): void => {
      const parent = child.parent;
      if (!parent) return;
      parent.children = parent.children.filter((node) => node !== child);
    },
    createText: (text: string): HostNode => ({ text, children: [], parent: null }),
    createComment: (text: string): HostNode => ({ text, children: [], parent: null }),
    setText: (node: HostNode, text: string): void => {
      node.text = text;
    },
    setElementText: (element: HostNode, text: string): void => {
      element.text = text;
    },
    parentNode: (node: HostNode): HostNode | null => node.parent,
    nextSibling: (node: HostNode): HostNode | null => {
      const parent = node.parent;
      if (!parent) return null;
      const index = parent.children.indexOf(node);
      return parent.children[index + 1] ?? null;
    },
    querySelector: (): null => null,
    setScopeId: (): void => undefined,
    patchProp: (element: HostNode, key: string, _previous: unknown, next: unknown): void => {
      (element as unknown as Record<string, unknown>)[key] = next;
    },
    cloneNode: (node: HostNode): HostNode => ({
      tag: node.tag,
      text: node.text,
      children: [],
      parent: null,
    }),
    insertStaticContent: (): [HostNode, HostNode] => {
      const node: HostNode = { children: [], parent: null };
      return [node, node];
    },
  };

  return createRenderer<HostNode, HostNode>(ops as never);
}

describe("createSceneComponent", () => {
  it("creates, updates, and remounts a scene", async () => {
    const created: Array<{ options: SceneOptions; handle: SceneHandle }> = [];
    const Probe = createSceneComponent<SceneOptions, SceneStats>({
      name: "Probe",
      className: "ascii-probe",
      create: (_canvas, options) => {
        const handle = fakeHandle();
        created.push({ options, handle });
        return handle;
      },
      props: {},
      options: (props) => {
        const options: SceneOptions = {};
        if (props.seed !== undefined) options.seed = props.seed as number;
        if (props.paused !== undefined) options.paused = props.paused as boolean;
        return options;
      },
      structuralKey: (props) => JSON.stringify([props.seed]),
    });

    const seed = ref(1);
    const paused = ref<boolean | undefined>(undefined);
    const Host = defineComponent({
      setup() {
        return () => h(Probe, { seed: seed.value, paused: paused.value, label: "Probe" });
      },
    });

    const renderer = makeRenderer();
    const root: HostNode = { children: [], parent: null };
    const app = renderer.createApp(Host);
    app.mount(root);
    await nextTick();

    expect(created).toHaveLength(1);
    expect(created[0]?.options).toEqual({ seed: 1 });

    seed.value = 2;
    await nextTick();
    await nextTick();

    expect(created).toHaveLength(2);
    expect(created[0]?.handle.destroy).toHaveBeenCalledTimes(1);
    expect(created[1]?.options).toEqual({ seed: 2 });

    paused.value = true;
    await nextTick();
    await nextTick();

    expect(created[1]?.handle.setOptions).toHaveBeenCalledWith(
      expect.objectContaining({ paused: true, seed: 2 }),
    );

    app.unmount();
  });
});
