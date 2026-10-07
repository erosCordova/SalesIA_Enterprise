import {
  useEffect,
  useMemo,
  useState,
} from "react";


type UbigeoId =
  string
  | number;


interface DepartmentItem {
  id: UbigeoId;
  departamento: string;
  ubigeo: string;
}


interface ProvinceItem {
  id: UbigeoId;
  provincia: string;
  ubigeo: string;
  departamento_id: UbigeoId;
}


interface DistrictItem {
  id: UbigeoId;
  distrito: string;
  ubigeo: string;
  provincia_id: UbigeoId;
  departamento_id: UbigeoId;
}


interface DepartmentsResponse {
  ubigeo_departamentos:
    DepartmentItem[];
}


interface ProvincesResponse {
  ubigeo_provincias:
    ProvinceItem[];
}


interface DistrictsResponse {
  ubigeo_distritos:
    DistrictItem[];
}


interface PeruLocationFieldsProps {
  department: string;
  province: string;
  district: string;
  address: string;

  disabled?: boolean;

  onDepartmentChange:
    (value: string) => void;

  onProvinceChange:
    (value: string) => void;

  onDistrictChange:
    (value: string) => void;

  onAddressChange:
    (value: string) => void;
}


function normalize(
  value:
    string
    | null
    | undefined,
) {
  return (
    value
      ?.normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .trim()
      .toUpperCase()
    ?? ""
  );
}


function sameId(
  first:
    UbigeoId,
  second:
    UbigeoId,
) {
  return (
    String(first)
    === String(second)
  );
}


function prettyName(
  value: string,
) {
  return value
    .toLocaleLowerCase(
      "es-PE",
    )
    .replace(
      /(^|\s)\S/g,
      (
        letter,
      ) =>
        letter.toLocaleUpperCase(
          "es-PE",
        ),
    );
}


export default function PeruLocationFields({
  department,
  province,
  district,
  address,
  disabled = false,
  onDepartmentChange,
  onProvinceChange,
  onDistrictChange,
  onAddressChange,
}: PeruLocationFieldsProps) {
  const [
    departments,
    setDepartments,
  ] =
    useState<
      DepartmentItem[]
    >([]);


  const [
    provinces,
    setProvinces,
  ] =
    useState<
      ProvinceItem[]
    >([]);


  const [
    districts,
    setDistricts,
  ] =
    useState<
      DistrictItem[]
    >([]);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    loadError,
    setLoadError,
  ] =
    useState("");


  useEffect(
    () => {
      let mounted =
        true;


      async function loadUbigeo() {
        setLoading(
          true,
        );

        setLoadError(
          "",
        );


        try {
          const [
            departmentResponse,
            provinceResponse,
            districtResponse,
          ] =
            await Promise.all([
              fetch(
                "/data/ubigeo/departments.json",
              ),

              fetch(
                "/data/ubigeo/provinces.json",
              ),

              fetch(
                "/data/ubigeo/districts.json",
              ),
            ]);


          if (
            !departmentResponse.ok
            || !provinceResponse.ok
            || !districtResponse.ok
          ) {
            throw new Error(
              "No se pudo cargar el padrón de ubicaciones del Perú.",
            );
          }


          const departmentData =
            (
              await departmentResponse.json()
            ) as DepartmentsResponse;


          const provinceData =
            (
              await provinceResponse.json()
            ) as ProvincesResponse;


          const districtData =
            (
              await districtResponse.json()
            ) as DistrictsResponse;


          if (!mounted) {
            return;
          }


          setDepartments(
            departmentData
              .ubigeo_departamentos
            ?? [],
          );


          setProvinces(
            provinceData
              .ubigeo_provincias
            ?? [],
          );


          setDistricts(
            districtData
              .ubigeo_distritos
            ?? [],
          );
        } catch (
          currentError
        ) {
          if (!mounted) {
            return;
          }


          setLoadError(
            currentError
              instanceof Error
              ? currentError.message
              : "No se pudieron cargar las ubicaciones.",
          );
        } finally {
          if (mounted) {
            setLoading(
              false,
            );
          }
        }
      }


      void loadUbigeo();


      return () => {
        mounted =
          false;
      };
    },
    [],
  );


  const orderedDepartments =
    useMemo(
      () =>
        [...departments].sort(
          (
            first,
            second,
          ) =>
            first.departamento.localeCompare(
              second.departamento,
              "es",
            ),
        ),
      [
        departments,
      ],
    );


  const selectedDepartment =
    useMemo(
      () =>
        departments.find(
          (
            item,
          ) =>
            normalize(
              item.departamento,
            )
            === normalize(
              department,
            ),
        )
        ?? null,
      [
        departments,
        department,
      ],
    );


  const availableProvinces =
    useMemo(
      () => {
        if (
          !selectedDepartment
        ) {
          return [];
        }


        return provinces
          .filter(
            (
              item,
            ) =>
              sameId(
                item.departamento_id,
                selectedDepartment.id,
              ),
          )
          .sort(
            (
              first,
              second,
            ) =>
              first.provincia.localeCompare(
                second.provincia,
                "es",
              ),
          );
      },
      [
        provinces,
        selectedDepartment,
      ],
    );


  const selectedProvince =
    useMemo(
      () =>
        availableProvinces.find(
          (
            item,
          ) =>
            normalize(
              item.provincia,
            )
            === normalize(
              province,
            ),
        )
        ?? null,
      [
        availableProvinces,
        province,
      ],
    );


  const availableDistricts =
    useMemo(
      () => {
        if (
          !selectedProvince
        ) {
          return [];
        }


        return districts
          .filter(
            (
              item,
            ) =>
              sameId(
                item.provincia_id,
                selectedProvince.id,
              ),
          )
          .sort(
            (
              first,
              second,
            ) =>
              first.distrito.localeCompare(
                second.distrito,
                "es",
              ),
          );
      },
      [
        districts,
        selectedProvince,
      ],
    );


  const selectedDistrict =
    useMemo(
      () =>
        availableDistricts.find(
          (
            item,
          ) =>
            normalize(
              item.distrito,
            )
            === normalize(
              district,
            ),
        )
        ?? null,
      [
        availableDistricts,
        district,
      ],
    );


  if (loadError) {
    return (
      <div className="form-full">
        <div
          style={{
            padding:
              "10px 12px",

            border:
              "1px solid #fecaca",

            borderRadius:
              "8px",

            color:
              "#b91c1c",

            background:
              "#fef2f2",

            fontSize:
              "12px",
          }}
        >
          {loadError}
        </div>
      </div>
    );
  }


  return (
    <>
      <label>
        <span>
          Departamento
        </span>

        <select
          value={
            selectedDepartment
              ? String(
                  selectedDepartment.id,
                )
              : ""
          }
          disabled={
            disabled
            || loading
          }
          required
          onChange={(
            event,
          ) => {
            const selected =
              departments.find(
                (
                  item,
                ) =>
                  String(
                    item.id,
                  )
                  ===
                  event.target.value,
              );


            onDepartmentChange(
              selected
                ? prettyName(
                    selected.departamento,
                  )
                : "",
            );
          }}
        >
          <option value="">
            {loading
              ? "Cargando departamentos..."
              : "Seleccionar departamento"}
          </option>

          {orderedDepartments.map(
            (
              item,
            ) => (
              <option
                key={
                  String(
                    item.id,
                  )
                }
                value={
                  String(
                    item.id,
                  )
                }
              >
                {
                  prettyName(
                    item.departamento,
                  )
                }
              </option>
            ),
          )}
        </select>
      </label>


      <label>
        <span>
          Provincia
        </span>

        <select
          value={
            selectedProvince
              ? String(
                  selectedProvince.id,
                )
              : ""
          }
          disabled={
            disabled
            || loading
            || !selectedDepartment
          }
          required
          onChange={(
            event,
          ) => {
            const selected =
              availableProvinces.find(
                (
                  item,
                ) =>
                  String(
                    item.id,
                  )
                  ===
                  event.target.value,
              );


            onProvinceChange(
              selected
                ? prettyName(
                    selected.provincia,
                  )
                : "",
            );
          }}
        >
          <option value="">
            {!selectedDepartment
              ? "Primero selecciona departamento"
              : "Seleccionar provincia"}
          </option>

          {availableProvinces.map(
            (
              item,
            ) => (
              <option
                key={
                  String(
                    item.id,
                  )
                }
                value={
                  String(
                    item.id,
                  )
                }
              >
                {
                  prettyName(
                    item.provincia,
                  )
                }
              </option>
            ),
          )}
        </select>
      </label>


      <label>
        <span>
          Distrito
        </span>

        <select
          value={
            selectedDistrict
              ? String(
                  selectedDistrict.id,
                )
              : ""
          }
          disabled={
            disabled
            || loading
            || !selectedProvince
          }
          required
          onChange={(
            event,
          ) => {
            const selected =
              availableDistricts.find(
                (
                  item,
                ) =>
                  String(
                    item.id,
                  )
                  ===
                  event.target.value,
              );


            onDistrictChange(
              selected
                ? prettyName(
                    selected.distrito,
                  )
                : "",
            );
          }}
        >
          <option value="">
            {!selectedProvince
              ? "Primero selecciona provincia"
              : "Seleccionar distrito"}
          </option>

          {availableDistricts.map(
            (
              item,
            ) => (
              <option
                key={
                  String(
                    item.id,
                  )
                }
                value={
                  String(
                    item.id,
                  )
                }
              >
                {
                  prettyName(
                    item.distrito,
                  )
                }
              </option>
            ),
          )}
        </select>
      </label>


      <label className="form-full">
        <span>
          Dirección
        </span>

        <input
          value={
            address
          }
          disabled={
            disabled
            || !selectedDistrict
          }
          required
          onChange={(
            event,
          ) =>
            onAddressChange(
              event.target.value,
            )
          }
          placeholder={
            selectedDistrict
              ? "Ej. Av. Principal 123"
              : "Selecciona primero el distrito"
          }
        />

        <small
          style={{
            display:
              "block",

            marginTop:
              "5px",

            color:
              selectedDistrict
                ? "#64748b"
                : "#94a3b8",

            fontSize:
              "10px",
          }}
        >
          {selectedDistrict
            ? `Dirección de la sucursal en ${prettyName(
                selectedDistrict.distrito,
              )}.`
            : "La dirección se habilitará al seleccionar el distrito."}
        </small>
      </label>
    </>
  );
}
