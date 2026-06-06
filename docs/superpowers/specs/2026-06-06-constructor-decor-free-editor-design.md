# Constructor Decor Free Editor Design

Date: 2026-06-06

## Scope

This spec redesigns step 5, `Декор`, of the 3D cake constructor.

The goal is to move from the current singleton placement model to a free editor:

- add any available model-backed `Декор` multiple times;
- drag each instance on the top surface of the top `Ярус`;
- rotate the selected instance smoothly around X, Y, and Z;
- keep pricing, cart, checkout, and order creation server-verified.

The implementation must keep using prepared GLB assets only. It must not scale, recolor, edit geometry, procedurally draw decor, or use fallback models.

## Research Notes

Competitor patterns reviewed:

- [Cakenote](https://www.cakenote.com/) focuses on cake design, itemisation, and pricing as elements are added.
- [Laracake](https://laracake.store/) positions itself around real-time 3D visualization with shapes, flavors, and toppings.
- [Dairy Queen custom cakes](https://www.dairyqueen.com/en-us/cakes/) and [Baskin-Robbins cake ordering](https://order.baskinrobbins.com/menu/cakes-pies) are more template/order-flow oriented than free 3D editing.

The useful takeaway for this project: because the 3D constructor is the core feature, step 5 should behave as a direct object editor rather than a template picker. Pricing should remain clear and itemized, but placement should feel visual and immediate.

## Approved UX

The user chose approach 1: a free instance editor.

Step 5 keeps the existing two-zone constructor layout:

- the 3D scene is the primary editing surface;
- the settings panel contains the decor catalog, selected-instance details, placed-instance list, price state, and cart CTA.

Catalog behavior:

- each decor card can be clicked to add one instance at a safe default point;
- each decor card can also be dragged to the top surface of the cake;
- every click or drag creates a new instance until the limit is reached;
- there is no automatic replacement of existing surface decor or candle instances.

Placed-instance behavior:

- clicking a GLB instance selects it;
- clicking a row in the placed-instance list also selects it;
- selected instances can be moved, rotated, duplicated, or removed;
- a global clear action can remove all decor.

The v1 limit is 40 decor instances per cake. This is high enough to feel free while still protecting WebGL performance, UI readability, and pricing payload size.

## Rotation HUD

Rotation is controlled primarily on the scene, not only in the side panel.

When an instance is selected, a DOM HUD appears above the Canvas, anchored to the selected GLB's projected screen position. The HUD is not 3D geometry.

The HUD contains:

- axis selector: X, Y, Z;
- two hold buttons: rotate left and rotate right;
- duplicate action;
- remove action.

While the user holds a rotate button, the selected instance rotates smoothly around the chosen axis. Releasing the button commits the final angle to the constructor store.

The side panel displays exact values for `rotation.x`, `rotation.y`, and `rotation.z` in degrees. It does not need to be the primary rotation control.

## Data Model

Extend `DecorationInstance` with rotation:

```ts
interface DecorationInstance {
  instanceId: string;
  decorationId: string;
  visualKey: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
}
```

Angles are stored in degrees for UI readability. R3F converts them to radians when applying them to the GLB group.

Legacy persisted instances without `rotation` are normalized to:

```ts
{ x: 0, y: 0, z: 0 }
```

Add selected-instance UI state:

```ts
selectedDecorationInstanceId: string | null
```

This state is only for editing. It is not part of the business pricing payload.

## Store Rules

Remove the current singleton enforcement for `surfaceDecor` and `candle`.

New rules:

- `addDecorationInstance` always appends a new instance unless the 40-item limit is reached;
- `duplicateDecorationInstance` copies `visualKey`, `decorationId`, `rotation`, and position with a small top-surface-safe offset;
- `moveDecorationInstance` updates X/Z and recomputes Y from the top surface;
- `rotateDecorationInstance` commits final X/Y/Z degrees;
- `removeDecorationInstance` deletes one instance and clears selection if needed;
- `clearDecorations` removes all instances and clears selection;
- `activeDecorations` remains derived from current instances for compatibility;
- `selectedDecorations` remains grouped by `decorationId` for pricing.

When shape changes, instances whose `visualKey` is unavailable for the new shape are removed. Remaining instances keep X/Z and rotation, while Y is recalculated for the new top surface.

When tier count changes, instances keep X/Z and rotation. Y is recalculated from the new top `Ярус`.

## R3F Behavior

Each decor instance renders as one GLB group:

- group position = stored instance position;
- group rotation = stored instance rotation converted to radians;
- primitive object = cloned GLB scene;
- no scale;
- no material mutation;
- no geometry mutation;
- no fallback model.

Drag placement remains pointer-based:

- new-instance drag from the catalog dispatches a drop event with screen coordinates;
- the Canvas raycasts to a horizontal plane at the current top surface;
- X/Z are clamped to a conservative safe area for the current cake shape;
- Y is derived from the cake stack layout.

Existing-instance drag:

- moving is limited to the top surface;
- the object cannot be dragged vertically between tiers in v1;
- pointer capture is used so the drag is stable.

Rotation performance:

- smooth hold-to-rotate should use transient refs while the button is held;
- the final value is committed to Zustand on pointer up/cancel;
- avoid setState in `useFrame`;
- avoid broad Zustand selectors that rerender the whole scene.

GLB loading:

- continue using model registry paths only;
- preload decor models for the current shape;
- keep local Suspense/retained rendering so one loading decor model does not blank the whole cake.

## Top Surface Placement

Placement is limited to the upper surface of the top `Ярус`.

The first implementation can use conservative shape-specific 2D bounds:

- circle: clamp to a safe radius;
- square: clamp to a safe square box;
- heart: clamp to a conservative oval/heart-safe area.

This is intentionally not collision physics. It is a practical editor constraint that keeps decor on the cake without inventing new 3D geometry.

## Pricing And Order Flow

The pricing API contract does not change.

Before calling `POST /api/constructor/calculate`, instances are grouped:

```ts
[{ decorationId, quantity }]
```

Position and rotation do not affect price.

The server remains the source of truth for totals. Add-to-cart stays blocked while price is stale, updating, or errored.

Cart, checkout, and order history should preserve the full `decorationInstances` list so the `Конфигурация торта` can be previewed or restored with positions and rotations.

## UI Feedback

The editor should not block overlaps in v1.

Allowed soft warnings:

- near cake edge;
- close to another decor instance;
- many large decor instances;
- max decor count reached.

Warnings do not block cart submission. They are guidance, not hidden business rules.

## Mobile Behavior

On mobile:

- the 3D scene stays on top;
- the bottom sheet contains catalog, selected-instance details, and placed-instance list;
- price and cart CTA stay sticky at the bottom;
- selected-instance HUD remains anchored over the Canvas, with touch-friendly controls.

The hold-to-rotate buttons must support pointer events, not mouse-only events.

## Non-Goals

This spec does not include:

- arbitrary placement on lower tiers or sides;
- collision physics;
- automatic layout suggestions;
- procedural helper meshes in 3D;
- scaling decor;
- recoloring decor;
- editing GLB files;
- new API DTOs;
- DB schema changes;
- automated tests in this iteration, per user request.

## Manual Verification Plan

Because the user asked to write code without tests for the next implementation step, verification should be manual and command-based:

- open `/constructor`;
- add 1, 10, and 40 decor instances;
- drag instances on circle, square, and heart cakes;
- rotate selected instances around X, Y, and Z;
- duplicate and remove instances;
- change shape and tier count after placement;
- verify price transitions through server-verified state;
- add to cart and complete checkout;
- inspect browser console and Next/API logs for errors;
- run `pnpm type-check` and `git diff --check`.

## Implementation Preference

Implementation should be incremental:

1. update store data shape and normalization;
2. remove singleton placement enforcement;
3. add selected instance state and actions;
4. apply X/Y/Z rotation in `GlbDecoration`;
5. add HUD overlay and smooth hold-to-rotate behavior;
6. update `StepDecor` list and actions;
7. verify constructor-to-checkout flow manually.
