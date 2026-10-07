import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import {
  Building2,
  MapPin,
} from "lucide-react";

import type {
  Branch,
} from "../../types/organization";


interface PeruBranchMapProps {
  branches: Branch[];
  loading?: boolean;
  error?: string | null;
}


type Position = [
  number,
  number,
];


interface PolygonGeometry {
  type: "Polygon";

  coordinates:
    Position[][];  
}


interface MultiPolygonGeometry {
  type: "MultiPolygon";

  coordinates:
    Position[][][];
}


type PeruGeometry =
  | PolygonGeometry
  | MultiPolygonGeometry;


interface PeruFeature {
  type: "Feature";

  properties:
    Record<
      string,
      unknown
    >;

  geometry:
    PeruGeometry;
}


interface PeruFeatureCollection {
  type:
    "FeatureCollection";

  features:
    PeruFeature[];
}


interface ProjectedPoint {
  x: number;
  y: number;
}


interface BranchMarker {
  id: string;

  name: string;

  city:
    string
    | null;

  department:
    string
    | null;

  address:
    string
    | null;

  x: number;

  y: number;

  exact: boolean;
}


interface Bounds {
  minLongitude: number;
  maxLongitude: number;

  minLatitude: number;
  maxLatitude: number;
}


interface ProjectionData {
  project:
    (
      position:
        Position,
    ) =>
      ProjectedPoint;

  bounds:
    Bounds;
}


const GEOJSON_URL =
  "/maps/peru-departments.geojson";


const MAP_WIDTH =
  680;


const MAP_HEIGHT =
  650;


const MAP_PADDING =
  32;


function normalize(
  value:
    string
    | null
    | undefined,
) {
  const normalized =
    value
      ?.normalize(
        "NFD",
      )
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .replace(
        /[^a-zA-Z]/g,
        "",
      )
      .toLowerCase()
    ?? "";


  if (
    normalized ===
    "elcallao"
  ) {
    return "callao";
  }


  if (
    normalized ===
    "municipalidadmetropolitanadelima"
  ) {
    return "limametropolitana";
  }


  return normalized;
}


function featureName(
  feature:
    PeruFeature,
) {
  const properties =
    feature.properties
    ?? {};


  const candidates = [
    properties.shapeName,
    properties.name,
    properties.NAME_1,
    properties.NOMBDEP,
    properties.NOMDEP,
    properties.NOMBRE,
    properties.DEPARTAMENTO,
    properties.departamento,
  ];


  for (
    const candidate
    of candidates
  ) {
    if (
      typeof candidate ===
        "string"
      && candidate.trim()
    ) {
      return candidate.trim();
    }
  }


  return "Departamento";
}


function displayDepartment(
  name:
    string,
) {
  const normalized =
    normalize(
      name,
    );


  if (
    normalized ===
    "callao"
  ) {
    return "Callao";
  }


  if (
    normalized ===
    "limametropolitana"
  ) {
    return "Lima Metropolitana";
  }


  return name;
}


function departmentKeyFromBranch(
  branch:
    Branch,
) {
  const department =
    normalize(
      branch.department,
    );


  if (
    department
  ) {
    return department;
  }


  return normalize(
    branch.city,
  );
}


function featureMatchesBranch(
  feature:
    PeruFeature,
  branch:
    Branch,
) {
  const featureKey =
    normalize(
      featureName(
        feature,
      ),
    );


  const branchKey =
    departmentKeyFromBranch(
      branch,
    );


  if (
    !featureKey
    || !branchKey
  ) {
    return false;
  }


  if (
    featureKey ===
    branchKey
  ) {
    return true;
  }


  /*
   * Una sucursal registrada como Lima
   * se asocia al departamento Lima.
   * Lima Metropolitana permanece como
   * geometría independiente.
   */

  if (
    branchKey ===
      "callao"
    && featureKey ===
      "callao"
  ) {
    return true;
  }


  return false;
}


function findDepartmentFeature(
  branch:
    Branch,
  features:
    PeruFeature[],
) {
  return (
    features.find(
      (
        feature,
      ) =>
        featureMatchesBranch(
          feature,
          branch,
        ),
    )
    ?? null
  );
}


function geometryPositions(
  geometry:
    PeruGeometry,
) {
  const result:
    Position[] = [];


  if (
    geometry.type ===
    "Polygon"
  ) {
    geometry.coordinates.forEach(
      (
        ring,
      ) => {
        ring.forEach(
          (
            position,
          ) => {
            result.push(
              position,
            );
          },
        );
      },
    );


    return result;
  }


  geometry.coordinates.forEach(
    (
      polygon,
    ) => {
      polygon.forEach(
        (
          ring,
        ) => {
          ring.forEach(
            (
              position,
            ) => {
              result.push(
                position,
              );
            },
          );
        },
      );
    },
  );


  return result;
}


function calculateBounds(
  collection:
    PeruFeatureCollection,
): Bounds {
  let minLongitude =
    Infinity;

  let maxLongitude =
    -Infinity;

  let minLatitude =
    Infinity;

  let maxLatitude =
    -Infinity;


  collection.features.forEach(
    (
      feature,
    ) => {
      geometryPositions(
        feature.geometry,
      ).forEach(
        (
          [
            longitude,
            latitude,
          ],
        ) => {
          if (
            !Number.isFinite(
              longitude,
            )
            || !Number.isFinite(
              latitude,
            )
          ) {
            return;
          }


          minLongitude =
            Math.min(
              minLongitude,
              longitude,
            );

          maxLongitude =
            Math.max(
              maxLongitude,
              longitude,
            );

          minLatitude =
            Math.min(
              minLatitude,
              latitude,
            );

          maxLatitude =
            Math.max(
              maxLatitude,
              latitude,
            );
        },
      );
    },
  );


  return {
    minLongitude,
    maxLongitude,

    minLatitude,
    maxLatitude,
  };
}


function createProjection(
  collection:
    PeruFeatureCollection,
): ProjectionData {
  const bounds =
    calculateBounds(
      collection,
    );


  const longitudeRange =
    bounds.maxLongitude
    - bounds.minLongitude;


  const latitudeRange =
    bounds.maxLatitude
    - bounds.minLatitude;


  const drawableWidth =
    MAP_WIDTH
    - MAP_PADDING * 2;


  const drawableHeight =
    MAP_HEIGHT
    - MAP_PADDING * 2;


  const scale =
    Math.min(
      drawableWidth
      / longitudeRange,

      drawableHeight
      / latitudeRange,
    );


  const projectedWidth =
    longitudeRange
    * scale;


  const projectedHeight =
    latitudeRange
    * scale;


  const offsetX =
    (
      MAP_WIDTH
      - projectedWidth
    )
    / 2;


  const offsetY =
    (
      MAP_HEIGHT
      - projectedHeight
    )
    / 2;


  function project(
    [
      longitude,
      latitude,
    ]:
      Position,
  ): ProjectedPoint {
    return {
      x:
        offsetX
        + (
            longitude
            - bounds.minLongitude
          )
        * scale,

      y:
        offsetY
        + (
            bounds.maxLatitude
            - latitude
          )
        * scale,
    };
  }


  return {
    project,
    bounds,
  };
}


function ringPath(
  ring:
    Position[],
  project:
    ProjectionData["project"],
) {
  if (
    ring.length ===
    0
  ) {
    return "";
  }


  return (
    ring
      .map(
        (
          position,
          index,
        ) => {
          const point =
            project(
              position,
            );


          return (
            `${index === 0
              ? "M"
              : "L"}`
            + `${point.x.toFixed(2)},`
            + `${point.y.toFixed(2)}`
          );
        },
      )
      .join(" ")
    + " Z"
  );
}


function featurePath(
  feature:
    PeruFeature,
  project:
    ProjectionData["project"],
) {
  if (
    feature.geometry.type ===
    "Polygon"
  ) {
    return feature.geometry.coordinates
      .map(
        (
          ring,
        ) =>
          ringPath(
            ring,
            project,
          ),
      )
      .join(
        " ",
      );
  }


  return feature.geometry.coordinates
    .flatMap(
      (
        polygon,
      ) =>
        polygon.map(
          (
            ring,
          ) =>
            ringPath(
              ring,
              project,
            ),
        ),
    )
    .join(
      " ",
    );
}


function projectedOuterRings(
  feature:
    PeruFeature,
  project:
    ProjectionData["project"],
) {
  if (
    feature.geometry.type ===
    "Polygon"
  ) {
    const outer =
      feature.geometry.coordinates[
        0
      ];


    return outer
      ? [
          outer.map(
            project,
          ),
        ]
      : [];
  }


  return feature.geometry.coordinates
    .map(
      (
        polygon,
      ) =>
        polygon[0]
          ?.map(
            project,
          )
        ?? [],
    )
    .filter(
      (
        ring,
      ) =>
        ring.length >
        2,
    );
}


function signedArea(
  points:
    ProjectedPoint[],
) {
  let area =
    0;


  for (
    let index =
      0;

    index <
    points.length;

    index +=
      1
  ) {
    const current =
      points[
        index
      ];


    const next =
      points[
        (
          index + 1
        )
        % points.length
      ];


    area +=
      current.x
      * next.y
      - next.x
      * current.y;
  }


  return area / 2;
}


function polygonCentroid(
  points:
    ProjectedPoint[],
) {
  const area =
    signedArea(
      points,
    );


  if (
    Math.abs(
      area,
    ) <
    0.0001
  ) {
    const average =
      points.reduce(
        (
          accumulator,
          point,
        ) => ({
          x:
            accumulator.x
            + point.x,

          y:
            accumulator.y
            + point.y,
        }),
        {
          x: 0,
          y: 0,
        },
      );


    return {
      x:
        average.x
        / points.length,

      y:
        average.y
        / points.length,
    };
  }


  let centroidX =
    0;

  let centroidY =
    0;


  for (
    let index =
      0;

    index <
    points.length;

    index +=
      1
  ) {
    const current =
      points[
        index
      ];


    const next =
      points[
        (
          index + 1
        )
        % points.length
      ];


    const factor =
      current.x
      * next.y
      - next.x
      * current.y;


    centroidX +=
      (
        current.x
        + next.x
      )
      * factor;


    centroidY +=
      (
        current.y
        + next.y
      )
      * factor;
  }


  return {
    x:
      centroidX
      / (
          6
          * area
        ),

    y:
      centroidY
      / (
          6
          * area
        ),
  };
}


function featureCenter(
  feature:
    PeruFeature,
  project:
    ProjectionData["project"],
) {
  const rings =
    projectedOuterRings(
      feature,
      project,
    );


  if (
    rings.length ===
    0
  ) {
    return {
      x:
        MAP_WIDTH / 2,

      y:
        MAP_HEIGHT / 2,
    };
  }


  const largest =
    [...rings]
      .sort(
        (
          first,
          second,
        ) =>
          Math.abs(
            signedArea(
              second,
            ),
          )
          - Math.abs(
              signedArea(
                first,
              ),
            ),
      )[
        0
      ];


  return polygonCentroid(
    largest,
  );
}


function locationLabel(
  branch: {
    city:
      string
      | null;

    department:
      string
      | null;
  },
) {
  const values =
    [
      branch.city,
      branch.department,
    ]
      .filter(
        (
          value,
          index,
          array,
        ) =>
          Boolean(
            value,
          )
          && array.indexOf(
            value,
          )
          === index,
      );


  return (
    values.join(
      ", ",
    )
    || "Ubicación registrada"
  );
}


const styles:
  Record<
    string,
    CSSProperties
  > = {
  panel: {
    width:
      "100%",

    marginBottom:
      "16px",

    overflow:
      "hidden",

    border:
      "1px solid #dfe7ec",

    borderRadius:
      "15px",

    background:
      "#ffffff",

    boxShadow:
      "0 5px 18px rgba(15,23,42,0.04)",
  },


  header: {
    display:
      "flex",

    alignItems:
      "flex-start",

    justifyContent:
      "space-between",

    gap:
      "20px",

    padding:
      "16px 18px 14px",

    borderBottom:
      "1px solid #e9eef2",
  },


  eyebrow: {
    display:
      "block",

    color:
      "#0e9eb1",

    fontSize:
      "11px",

    fontWeight:
      800,

    letterSpacing:
      "0.1em",

    textTransform:
      "uppercase",
  },


  title: {
    margin:
      "4px 0 0",

    color:
      "#172033",

    fontSize:
      "22px",

    fontWeight:
      800,

    letterSpacing:
      "-0.025em",
  },


  description: {
    maxWidth:
      "650px",

    margin:
      "5px 0 0",

    color:
      "#64748b",

    fontSize:
      "13px",

    lineHeight:
      1.5,
  },


  counters: {
    display:
      "flex",

    gap:
      "8px",
  },


  counter: {
    display:
      "flex",

    minWidth:
      "105px",

    flexDirection:
      "column",

    justifyContent:
      "center",

    padding:
      "9px 12px",

    border:
      "1px solid #dce8eb",

    borderRadius:
      "9px",

    background:
      "#f7fcfd",

    textAlign:
      "center",
  },


  counterValue: {
    color:
      "#0e8194",

    fontSize:
      "18px",

    fontWeight:
      800,
  },


  counterLabel: {
    marginTop:
      "2px",

    color:
      "#64748b",

    fontSize:
      "10px",
  },


  legend: {
    display:
      "flex",

    alignItems:
      "center",

    gap:
      "22px",

    minHeight:
      "44px",

    padding:
      "0 18px",

    borderBottom:
      "1px solid #e9eef2",

    color:
      "#64748b",

    background:
      "#fbfcfd",

    fontSize:
      "11px",
  },


  legendItem: {
    display:
      "inline-flex",

    alignItems:
      "center",

    gap:
      "7px",
  },


  grid: {
    display:
      "grid",

    gridTemplateColumns:
      "minmax(0, 1fr) 300px",

    minHeight:
      "610px",
  },


  mapArea: {
    position:
      "relative",

    display:
      "flex",

    minWidth:
      0,

    alignItems:
      "center",

    justifyContent:
      "center",

    overflow:
      "hidden",

    padding:
      "18px",

    background:
      "radial-gradient(circle at 50% 45%, #ffffff 0%, #f7fbfc 72%, #f2f8fa 100%)",
  },


  svg: {
    display:
      "block",

    width:
      "min(100%, 720px)",

    height:
      "560px",

    background:
      "transparent",

    overflow:
      "visible",
  },


  tooltip: {
    position:
      "absolute",

    top:
      "18px",

    left:
      "18px",

    zIndex:
      5,

    display:
      "flex",

    minWidth:
      "200px",

    maxWidth:
      "300px",

    alignItems:
      "flex-start",

    gap:
      "9px",

    padding:
      "10px 12px",

    border:
      "1px solid #dbe7eb",

    borderRadius:
      "10px",

    background:
      "rgba(255,255,255,0.97)",

    boxShadow:
      "0 8px 24px rgba(15,23,42,0.08)",

    pointerEvents:
      "none",
  },


  tooltipIcon: {
    display:
      "grid",

    width:
      "30px",

    height:
      "30px",

    placeItems:
      "center",

    flex:
      "0 0 auto",

    borderRadius:
      "8px",

    color:
      "#0e8194",

    background:
      "#eaf9fb",
  },


  tooltipContent: {
    display:
      "flex",

    minWidth:
      0,

    flexDirection:
      "column",
  },


  tooltipTitle: {
    color:
      "#334155",

    fontSize:
      "12px",

    fontWeight:
      800,
  },


  tooltipSubtitle: {
    marginTop:
      "2px",

    color:
      "#0e8194",

    fontSize:
      "10px",

    fontWeight:
      700,
  },


  tooltipAddress: {
    marginTop:
      "4px",

    color:
      "#7b8b9e",

    fontSize:
      "9px",

    lineHeight:
      1.4,
  },


  side: {
    display:
      "flex",

    minWidth:
      0,

    flexDirection:
      "column",

    borderLeft:
      "1px solid #e9eef2",

    background:
      "#fbfcfd",
  },


  sideHeader: {
    display:
      "flex",

    minHeight:
      "62px",

    alignItems:
      "center",

    gap:
      "9px",

    padding:
      "12px 14px",

    borderBottom:
      "1px solid #e9eef2",

    color:
      "#0e9eb1",
  },


  sideHeaderTitle: {
    display:
      "block",

    color:
      "#334155",

    fontSize:
      "12px",

    fontWeight:
      800,
  },


  sideHeaderSub: {
    display:
      "block",

    marginTop:
      "2px",

    color:
      "#94a3b8",

    fontSize:
      "9px",
  },


  branchList: {
    flex:
      1,

    overflowY:
      "auto",

    padding:
      "6px 14px",
  },


  branchRow: {
    display:
      "grid",

    gridTemplateColumns:
      "11px minmax(0,1fr)",

    alignItems:
      "flex-start",

    gap:
      "8px",

    padding:
      "11px 0",

    borderBottom:
      "1px solid #edf1f4",
  },


  branchDot: {
    width:
      "8px",

    height:
      "8px",

    marginTop:
      "4px",

    borderRadius:
      "50%",

    background:
      "#0e9eb1",

    boxShadow:
      "0 0 0 3px rgba(14,158,177,0.11)",
  },


  branchName: {
    display:
      "block",

    overflow:
      "hidden",

    color:
      "#334155",

    fontSize:
      "11px",

    fontWeight:
      700,

    textOverflow:
      "ellipsis",

    whiteSpace:
      "nowrap",
  },


  branchLocation: {
    display:
      "block",

    marginTop:
      "2px",

    color:
      "#0e8194",

    fontSize:
      "9px",
  },


  branchAddress: {
    display:
      "block",

    marginTop:
      "2px",

    overflow:
      "hidden",

    color:
      "#94a3b8",

    fontSize:
      "9px",

    textOverflow:
      "ellipsis",

    whiteSpace:
      "nowrap",
  },


  warning: {
    display:
      "flex",

    flexDirection:
      "column",

    margin:
      "0 12px 10px",

    padding:
      "9px 10px",

    border:
      "1px solid #fed7aa",

    borderRadius:
      "8px",

    color:
      "#9a5b09",

    background:
      "#fffaf1",

    fontSize:
      "9px",
  },


  footer: {
    padding:
      "10px 13px",

    borderTop:
      "1px solid #e9eef2",

    color:
      "#94a3b8",

    background:
      "#ffffff",

    fontSize:
      "9px",

    lineHeight:
      1.4,
  },


  error: {
    position:
      "absolute",

    top:
      "18px",

    right:
      "18px",

    zIndex:
      10,

    maxWidth:
      "320px",

    padding:
      "9px 11px",

    border:
      "1px solid #fecaca",

    borderRadius:
      "8px",

    color:
      "#b91c1c",

    background:
      "#fef2f2",

    fontSize:
      "10px",
  },
};


export default function PeruBranchMap({
  branches,
  loading = false,
  error = null,
}: PeruBranchMapProps) {
  const [
    geography,
    setGeography,
  ] =
    useState<
      PeruFeatureCollection
      | null
    >(null);


  const [
    geographyError,
    setGeographyError,
  ] =
    useState("");


  const [
    hoveredDepartment,
    setHoveredDepartment,
  ] =
    useState<
      PeruFeature
      | null
    >(null);


  const [
    hoveredBranch,
    setHoveredBranch,
  ] =
    useState<
      BranchMarker
      | null
    >(null);


  useEffect(
    () => {
      let mounted =
        true;


      async function loadMap() {
        try {
          setGeographyError(
            "",
          );


          const response =
            await fetch(
              GEOJSON_URL,
            );


          if (!response.ok) {
            throw new Error(
              "No se pudo cargar el mapa del Perú.",
            );
          }


          const data =
            (
              await response.json()
            ) as PeruFeatureCollection;


          if (
            !Array.isArray(
              data.features,
            )
            || data.features.length ===
              0
          ) {
            throw new Error(
              "El mapa no contiene divisiones administrativas.",
            );
          }


          if (mounted) {
            setGeography(
              data,
            );
          }
        } catch (
          currentError
        ) {
          if (!mounted) {
            return;
          }


          setGeographyError(
            currentError
              instanceof Error
              ? currentError.message
              : "No se pudo cargar el mapa.",
          );
        }
      }


      void loadMap();


      return () => {
        mounted =
          false;
      };
    },
    [],
  );


  const projection =
    useMemo(
      () => {
        if (!geography) {
          return null;
        }


        return createProjection(
          geography,
        );
      },
      [
        geography,
      ],
    );


  const activeBranches =
    useMemo(
      () =>
        branches.filter(
          (
            branch,
          ) =>
            branch.status ===
            "active",
        ),
      [
        branches,
      ],
    );


  const branchCounts =
    useMemo(
      () => {
        const counts =
          new Map<
            string,
            number
          >();


        activeBranches.forEach(
          (
            branch,
          ) => {
            const key =
              departmentKeyFromBranch(
                branch,
              );


            if (!key) {
              return;
            }


            counts.set(
              key,
              (
                counts.get(
                  key,
                )
                ?? 0
              )
              + 1,
            );
          },
        );


        return counts;
      },
      [
        activeBranches,
      ],
    );


  const markers =
    useMemo<
      BranchMarker[]
    >(
      () => {
        if (
          !geography
          || !projection
        ) {
          return [];
        }


        const groups =
          new Map<
            string,
            Branch[]
          >();


        activeBranches.forEach(
          (
            branch,
          ) => {
            const key =
              departmentKeyFromBranch(
                branch,
              );


            if (!key) {
              return;
            }


            const group =
              groups.get(
                key,
              )
              ?? [];


            group.push(
              branch,
            );


            groups.set(
              key,
              group,
            );
          },
        );


        const result:
          BranchMarker[] = [];


        activeBranches.forEach(
          (
            branch,
          ) => {
            if (
              branch.latitude !==
                null
              && branch.longitude !==
                null
            ) {
              const point =
                projection.project([
                  branch.longitude,
                  branch.latitude,
                ]);


              result.push({
                id:
                  branch.id,

                name:
                  branch.name,

                city:
                  branch.city,

                department:
                  branch.department,

                address:
                  branch.address,

                x:
                  point.x,

                y:
                  point.y,

                exact:
                  true,
              });


              return;
            }


            const feature =
              findDepartmentFeature(
                branch,
                geography.features,
              );


            if (!feature) {
              return;
            }


            const center =
              featureCenter(
                feature,
                projection.project,
              );


            const key =
              departmentKeyFromBranch(
                branch,
              );


            const group =
              groups.get(
                key,
              )
              ?? [];


            const index =
              group.findIndex(
                (
                  current,
                ) =>
                  current.id ===
                  branch.id,
              );


            const count =
              group.length;


            const angle =
              count > 1
                ? (
                    Math.PI
                    * 2
                    * index
                  )
                  / count
                : 0;


            const radius =
              count > 1
                ? Math.min(
                    14,
                    6
                    + count,
                  )
                : 0;


            result.push({
              id:
                branch.id,

              name:
                branch.name,

              city:
                branch.city,

              department:
                branch.department,

              address:
                branch.address,

              x:
                center.x
                + Math.cos(
                    angle,
                  )
                * radius,

              y:
                center.y
                + Math.sin(
                    angle,
                  )
                * radius,

              exact:
                false,
            });
          },
        );


        return result;
      },
      [
        activeBranches,
        geography,
        projection,
      ],
    );


  const unresolved =
    useMemo(
      () => {
        if (!geography) {
          return [];
        }


        return activeBranches.filter(
          (
            branch,
          ) => {
            if (
              branch.latitude !==
                null
              && branch.longitude !==
                null
            ) {
              return false;
            }


            return !findDepartmentFeature(
              branch,
              geography.features,
            );
          },
        );
      },
      [
        activeBranches,
        geography,
      ],
    );


  const hoveredName =
    hoveredDepartment
      ? displayDepartment(
          featureName(
            hoveredDepartment,
          ),
        )
      : "";


  const hoveredCount =
    hoveredDepartment
      ? branchCounts.get(
          normalize(
            featureName(
              hoveredDepartment,
            ),
          ),
        )
        ?? 0
      : 0;


  return (
    <section
      style={
        styles.panel
      }
    >
      <header
        style={
          styles.header
        }
      >
        <div>
          <span
            style={
              styles.eyebrow
            }
          >
            Presencia territorial
          </span>

          <h2
            style={
              styles.title
            }
          >
            Mapa de sucursales
          </h2>

          <p
            style={
              styles.description
            }
          >
            Visualiza la presencia de sucursales
            de SalesIA en los distintos
            departamentos del Perú.
          </p>
        </div>


        <div
          style={
            styles.counters
          }
        >
          <div
            style={
              styles.counter
            }
          >
            <strong
              style={
                styles.counterValue
              }
            >
              {
                activeBranches.length
              }
            </strong>

            <span
              style={
                styles.counterLabel
              }
            >
              Sucursales
            </span>
          </div>


          <div
            style={
              styles.counter
            }
          >
            <strong
              style={
                styles.counterValue
              }
            >
              {
                branchCounts.size
              }
            </strong>

            <span
              style={
                styles.counterLabel
              }
            >
              Departamentos
            </span>
          </div>
        </div>
      </header>


      <div
        style={
          styles.legend
        }
      >
        <span
          style={
            styles.legendItem
          }
        >
          <i
            style={{
              width:
                "12px",

              height:
                "12px",

              border:
                "1px solid #9fc1c8",

              borderRadius:
                "3px",

              background:
                "#e7f0f2",
            }}
          />

          Departamento
        </span>


        <span
          style={
            styles.legendItem
          }
        >
          <i
            style={{
              width:
                "12px",

              height:
                "12px",

              border:
                "1px solid #55b8ae",

              borderRadius:
                "3px",

              background:
                "#c9eee8",
            }}
          />

          Con sucursal
        </span>


        <span
          style={
            styles.legendItem
          }
        >
          <i
            style={{
              width:
                "9px",

              height:
                "9px",

              border:
                "2px solid #ffffff",

              borderRadius:
                "50%",

              background:
                "#0e8194",

              boxShadow:
                "0 0 0 2px rgba(14,129,148,.18)",
            }}
          />

          Sucursal
        </span>
      </div>


      <div
        style={
          styles.grid
        }
      >
        <div
          style={
            styles.mapArea
          }
        >
          {(
            loading
            || !geography
            || !projection
          )
            && !geographyError ? (
            <div>
              Cargando mapa...
            </div>
          ) : (
            <>
              {(
                geographyError
                || error
              ) && (
                <div
                  style={
                    styles.error
                  }
                >
                  {
                    geographyError
                    || error
                  }
                </div>
              )}


              {(
                geography
                && projection
              ) && (
                <svg
                  viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                  style={
                    styles.svg
                  }
                  role="img"
                  aria-label="Mapa del Perú con departamentos y sucursales"
                >
                  {geography.features.map(
                    (
                      feature,
                      index,
                    ) => {
                      const name =
                        featureName(
                          feature,
                        );


                      const key =
                        normalize(
                          name,
                        );


                      const hasBranch =
                        branchCounts.has(
                          key,
                        );


                      const isHovered =
                        hoveredDepartment ===
                        feature;


                      const fill =
                        isHovered
                          ? (
                              hasBranch
                                ? "#0fa98f"
                                : "#20b7c6"
                            )
                          : (
                              hasBranch
                                ? "#c9eee8"
                                : "#e7f0f2"
                            );


                      const stroke =
                        isHovered
                          ? "#087f92"
                          : (
                              hasBranch
                                ? "#55b8ae"
                                : "#9fc1c8"
                            );


                      return (
                        <path
                          key={`${key}-${index}`}
                          d={
                            featurePath(
                              feature,
                              projection.project,
                            )
                          }
                          fill={
                            fill
                          }
                          fillRule="evenodd"
                          stroke={
                            stroke
                          }
                          strokeWidth={
                            isHovered
                              ? 1.5
                              : 0.9
                          }
                          vectorEffect="non-scaling-stroke"
                          style={{
                            cursor:
                              "pointer",

                            transition:
                              "fill .14s ease, stroke .14s ease",
                          }}
                          onMouseEnter={() => {
                            setHoveredDepartment(
                              feature,
                            );

                            setHoveredBranch(
                              null,
                            );
                          }}
                          onMouseLeave={() =>
                            setHoveredDepartment(
                              null,
                            )
                          }
                        >
                          <title>
                            {
                              displayDepartment(
                                name,
                              )
                            }
                          </title>
                        </path>
                      );
                    },
                  )}


                  {markers.map(
                    (
                      marker,
                    ) => {
                      const selected =
                        hoveredBranch?.id ===
                        marker.id;


                      return (
                        <g
                          key={
                            marker.id
                          }
                          transform={`translate(${marker.x} ${marker.y})`}
                          style={{
                            cursor:
                              "pointer",
                          }}
                          onMouseEnter={() => {
                            setHoveredBranch(
                              marker,
                            );

                            setHoveredDepartment(
                              null,
                            );
                          }}
                          onMouseLeave={() =>
                            setHoveredBranch(
                              null,
                            )
                          }
                        >
                          <circle
                            r={
                              selected
                                ? 12
                                : 10
                            }
                            fill="rgba(14,129,148,.18)"
                          />

                          <circle
                            r={
                              selected
                                ? 6.5
                                : 5
                            }
                            fill={
                              marker.exact
                                ? "#08a878"
                                : "#0e8194"
                            }
                            stroke="#ffffff"
                            strokeWidth="2.5"
                            vectorEffect="non-scaling-stroke"
                          />
                        </g>
                      );
                    },
                  )}
                </svg>
              )}


              <div
                style={
                  styles.tooltip
                }
              >
                <div
                  style={
                    styles.tooltipIcon
                  }
                >
                  <MapPin
                    size={16}
                  />
                </div>


                <div
                  style={
                    styles.tooltipContent
                  }
                >
                  {hoveredBranch ? (
                    <>
                      <strong
                        style={
                          styles.tooltipTitle
                        }
                      >
                        {
                          hoveredBranch.name
                        }
                      </strong>

                      <span
                        style={
                          styles.tooltipSubtitle
                        }
                      >
                        {
                          locationLabel(
                            hoveredBranch,
                          )
                        }
                      </span>

                      {
                        hoveredBranch.address
                        && (
                          <small
                            style={
                              styles.tooltipAddress
                            }
                          >
                            {
                              hoveredBranch.address
                            }
                          </small>
                        )
                      }
                    </>
                  ) : hoveredDepartment ? (
                    <>
                      <strong
                        style={
                          styles.tooltipTitle
                        }
                      >
                        {
                          hoveredName
                        }
                      </strong>

                      <span
                        style={
                          styles.tooltipSubtitle
                        }
                      >
                        {
                          hoveredCount
                        }{" "}
                        {
                          hoveredCount ===
                          1
                            ? "sucursal"
                            : "sucursales"
                        }
                      </span>
                    </>
                  ) : (
                    <>
                      <strong
                        style={
                          styles.tooltipTitle
                        }
                      >
                        Perú
                      </strong>

                      <span
                        style={
                          styles.tooltipSubtitle
                        }
                      >
                        Pasa el cursor por un departamento.
                      </span>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>


        <aside
          style={
            styles.side
          }
        >
          <div
            style={
              styles.sideHeader
            }
          >
            <Building2
              size={17}
            />

            <div>
              <strong
                style={
                  styles.sideHeaderTitle
                }
              >
                Sucursales activas
              </strong>

              <span
                style={
                  styles.sideHeaderSub
                }
              >
                Presencia registrada
              </span>
            </div>
          </div>


          <div
            style={
              styles.branchList
            }
          >
            {
              activeBranches.map(
                (
                  branch,
                ) => (
                  <article
                    key={
                      branch.id
                    }
                    style={
                      styles.branchRow
                    }
                  >
                    <i
                      style={
                        styles.branchDot
                      }
                    />

                    <div>
                      <strong
                        style={
                          styles.branchName
                        }
                      >
                        {
                          branch.name
                        }
                      </strong>

                      <span
                        style={
                          styles.branchLocation
                        }
                      >
                        {
                          locationLabel(
                            branch,
                          )
                        }
                      </span>

                      {
                        branch.address
                        && (
                          <small
                            style={
                              styles.branchAddress
                            }
                          >
                            {
                              branch.address
                            }
                          </small>
                        )
                      }
                    </div>
                  </article>
                ),
              )
            }
          </div>


          {
            unresolved.length >
            0 && (
              <div
                style={
                  styles.warning
                }
              >
                <strong>
                  {
                    unresolved.length
                  }{" "}
                  {
                    unresolved.length ===
                    1
                      ? "sucursal sin ubicación"
                      : "sucursales sin ubicación"
                  }
                </strong>

                <span>
                  Selecciona su departamento
                  para incorporarla al mapa.
                </span>
              </div>
            )
          }


          <footer
            style={
              styles.footer
            }
          >
            Los puntos se actualizan
            automáticamente según las
            sucursales registradas.
          </footer>
        </aside>
      </div>
    </section>
  );
}
