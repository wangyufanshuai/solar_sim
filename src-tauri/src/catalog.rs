use crate::resources::catalog_path;
use rusqlite::{params, Connection};
use serde::Serialize;
use tauri::AppHandle;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CatalogSearchResult {
    id: String,
    display_name: String,
    designation: String,
    object_type: String,
    ra_deg: f64,
    dec_deg: f64,
    data_tier: String,
    exoplanet_system_id: Option<String>,
    gaia_source_id: Option<String>,
    mag_g: Option<f64>,
    bp_rp: Option<f64>,
    parallax_mas: Option<f64>,
    teff_k: Option<f64>,
    logg: Option<f64>,
    radius_solar: Option<f64>,
    spectral_type: Option<String>,
}

#[tauri::command]
pub(crate) fn search_catalog(
    app: AppHandle,
    query: String,
    limit: Option<u32>,
) -> Result<Vec<CatalogSearchResult>, String> {
    let normalized = query.trim();
    if normalized.len() < 2 {
        return Ok(Vec::new());
    }
    let connection = Connection::open(catalog_path(&app)?).map_err(|error| error.to_string())?;
    let result_limit = limit.unwrap_or(20).min(100);
    let exact_source_id = normalized
        .to_ascii_lowercase()
        .replace("gaia", "")
        .replace("dr3", "")
        .replace(' ', "")
        .parse::<i64>()
        .ok();
    if let Some(source_id) = exact_source_id {
        let mut statement = connection.prepare(
            "SELECT id,display_name,designation,object_type,ra_deg,dec_deg,data_tier,exoplanet_system_id,gaia_source_id,mag_g,bp_rp,parallax_mas,teff_k,logg,radius_solar,spectral_type FROM catalog_objects WHERE gaia_source_id=?1 LIMIT ?2",
        ).map_err(|error| error.to_string())?;
        let rows = statement
            .query_map(params![source_id, result_limit], catalog_result_from_row)
            .map_err(|error| error.to_string())?;
        return rows
            .collect::<Result<Vec<_>, _>>()
            .map_err(|error| error.to_string());
    }
    let mut statement = connection.prepare(
        "SELECT o.id,o.display_name,o.designation,o.object_type,o.ra_deg,o.dec_deg,o.data_tier,o.exoplanet_system_id,o.gaia_source_id,o.mag_g,o.bp_rp,o.parallax_mas,o.teff_k,o.logg,o.radius_solar,o.spectral_type
         FROM catalog_fts f JOIN catalog_objects o ON o.rowid=f.rowid
         WHERE catalog_fts MATCH ?1 ORDER BY rank LIMIT ?2",
    ).map_err(|error| error.to_string())?;
    let search_expression = normalized
        .split_whitespace()
        .map(|term| format!("\"{}\"*", term.replace('"', "")))
        .collect::<Vec<_>>()
        .join(" ");
    let rows = statement
        .query_map(
            params![search_expression, result_limit],
            catalog_result_from_row,
        )
        .map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

fn catalog_result_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<CatalogSearchResult> {
    Ok(CatalogSearchResult {
        id: row.get(0)?,
        display_name: row.get(1)?,
        designation: row.get(2)?,
        object_type: row.get(3)?,
        ra_deg: row.get(4)?,
        dec_deg: row.get(5)?,
        data_tier: row.get(6)?,
        exoplanet_system_id: row.get(7)?,
        gaia_source_id: row.get::<_, Option<i64>>(8)?.map(|value| value.to_string()),
        mag_g: row.get(9)?,
        bp_rp: row.get(10)?,
        parallax_mas: row.get(11)?,
        teff_k: row.get(12)?,
        logg: row.get(13)?,
        radius_solar: row.get(14)?,
        spectral_type: row.get(15)?,
    })
}

#[tauri::command]
pub(crate) fn get_catalog_object(
    app: AppHandle,
    id: String,
) -> Result<Option<CatalogSearchResult>, String> {
    let connection = Connection::open(catalog_path(&app)?).map_err(|error| error.to_string())?;
    let mut statement = connection.prepare(
        "SELECT id,display_name,designation,object_type,ra_deg,dec_deg,data_tier,exoplanet_system_id,gaia_source_id,mag_g,bp_rp,parallax_mas,teff_k,logg,radius_solar,spectral_type FROM catalog_objects WHERE id=?1 LIMIT 1",
    ).map_err(|error| error.to_string())?;
    let mut rows = statement
        .query(params![id])
        .map_err(|error| error.to_string())?;
    let Some(row) = rows.next().map_err(|error| error.to_string())? else {
        return Ok(None);
    };
    catalog_result_from_row(row)
        .map(Some)
        .map_err(|error| error.to_string())
}
