import { type Component, For } from "solid-js";
import { type Building as TBuilding } from "@/types/buildings";

const Building: Component<{ building: TBuilding; scale: number }> = (props) => {
  return (
    <g>
      <For each={props.building.walls}>
        {(wall, i) => {
          const walls = props.building.walls;
          const nextWall = walls[(i() + 1) % walls.length];
          return (
            <line
              x1={wall.corner.x * props.scale}
              y1={wall.corner.y * props.scale}
              x2={nextWall.corner.x * props.scale}
              y2={nextWall.corner.y * props.scale}
              stroke="black"
              stroke-width={wall.thick * props.scale}
            />
          );
        }}
      </For>
    </g>
  );
};
export default Building;
