import type { OutageIncident, Site } from "./types";

export const workbookSites = [
  {
    "id": "site-uvtswgl00003",
    "ssa": "WARANGAL",
    "sdca": "ETURNAGARAM",
    "btsId": "UVTSWGL00003",
    "btsName": "B01_Banjarellapur_577983_UVTSWGL00003",
    "ipId": "UVTSWGL00003",
    "technology": "4G",
    "siteType": "SA",
    "vendor": "TEJAS",
    "sdeId": "sde-eturnagaram",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-wl2166",
    "ssa": "WARANGAL",
    "sdca": "ETURNAGARAM",
    "btsId": "WL2166",
    "btsName": "B28_Katapur_WL2166",
    "ipId": "WL2166",
    "technology": "4G",
    "siteType": "NB",
    "vendor": "TEJAS",
    "sdeId": "sde-eturnagaram",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-uvtswgl00040",
    "ssa": "WARANGAL",
    "sdca": "ETURNAGARAM",
    "btsId": "UVTSWGL00040",
    "btsName": "B28_Bhupathipuram_577863_UVTSWGL00040",
    "ipId": "UVTSWGL00040",
    "technology": "4G",
    "siteType": "SA",
    "vendor": "TEJAS",
    "sdeId": "sde-eturnagaram",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-wl5152",
    "ssa": "WARANGAL",
    "sdca": "ETURNAGARAM",
    "btsId": "WL5152",
    "btsName": "338_6538_Dvdla_Gangaram_WL5152",
    "ipId": "WL5152",
    "technology": "3G",
    "siteType": "NB",
    "vendor": "ZTE",
    "sdeId": "sde-eturnagaram",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-wl2228",
    "ssa": "WARANGAL",
    "sdca": "ETURNAGARAM",
    "btsId": "WL2228",
    "btsName": "B41_Eturunagaram_BS_WL2228",
    "ipId": "WL2228",
    "technology": "4G",
    "siteType": "NB",
    "vendor": "TEJAS",
    "sdeId": "sde-eturnagaram",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-wl2025",
    "ssa": "WARANGAL",
    "sdca": "ETURNAGARAM",
    "btsId": "WL2025",
    "btsName": "B41_Eturunagaram_WL2025",
    "ipId": "WL2025",
    "technology": "4G",
    "siteType": "BS",
    "vendor": "TEJAS",
    "sdeId": "sde-eturnagaram",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-wl5153",
    "ssa": "WARANGAL",
    "sdca": "ETURNAGARAM",
    "btsId": "WL5153",
    "btsName": "B01_Thupakulagudem_WL5153",
    "ipId": "WL5153",
    "technology": "4G",
    "siteType": "NB",
    "vendor": "TEJAS",
    "sdeId": "sde-eturnagaram",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-wl5046",
    "ssa": "WARANGAL",
    "sdca": "ETURNAGARAM",
    "btsId": "WL5046",
    "btsName": "285_503_Narsimhasagar_WL5046",
    "ipId": "WL5046",
    "technology": "2G",
    "siteType": "NB",
    "vendor": "ZTE",
    "sdeId": "sde-eturnagaram",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-uvtswgl00011",
    "ssa": "WARANGAL",
    "sdca": "ETURNAGARAM",
    "btsId": "UVTSWGL00011",
    "btsName": "B28_Kanthanapalle_279531_UVTSWGL00011",
    "ipId": "UVTSWGL00011",
    "technology": "4G",
    "siteType": "SA",
    "vendor": "TEJAS",
    "sdeId": "sde-eturnagaram",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-uvtswgl00008",
    "ssa": "WARANGAL",
    "sdca": "ETURNAGARAM",
    "btsId": "UVTSWGL00008",
    "btsName": "B01_Bollepalle_(PL)_578003_UVTSWGL00008",
    "ipId": "UVTSWGL00008",
    "technology": "4G",
    "siteType": "SA",
    "vendor": "TEJAS",
    "sdeId": "sde-eturnagaram",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-uvtswgl00039",
    "ssa": "WARANGAL",
    "sdca": "ETURNAGARAM",
    "btsId": "UVTSWGL00039",
    "btsName": "B28_Chityala_577877_UVTSWGL00039",
    "ipId": "UVTSWGL00039",
    "technology": "4G",
    "siteType": "SA",
    "vendor": "TEJAS",
    "sdeId": "sde-eturnagaram",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-uvtswgl00154",
    "ssa": "WARANGAL",
    "sdca": "MULUGU",
    "btsId": "UVTSWGL00154",
    "btsName": "B01_B28_Bandlapahad_577852_UVTSWGL00154",
    "ipId": "UVTSWGL00154",
    "technology": "4G",
    "siteType": "SA",
    "vendor": "TEJAS",
    "sdeId": "sde-mulugu",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-wl2041",
    "ssa": "WARANGAL",
    "sdca": "MULUGU",
    "btsId": "WL2041",
    "btsName": "B41_Pasara_WL2041",
    "ipId": "WL2041",
    "technology": "4G",
    "siteType": "BS",
    "vendor": "TEJAS",
    "sdeId": "sde-mulugu",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-uvtswgl00062",
    "ssa": "WARANGAL",
    "sdca": "NARSAMPET",
    "btsId": "UVTSWGL00062",
    "btsName": "B01_Karnegandi_578414_UVTSWGL00062",
    "ipId": "UVTSWGL00062",
    "technology": "4G",
    "siteType": "SA",
    "vendor": "TEJAS",
    "sdeId": "sde-narsampet",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-uvtswgl00078",
    "ssa": "WARANGAL",
    "sdca": "NARSAMPET",
    "btsId": "UVTSWGL00078",
    "btsName": "B01_Thativarivempally_279281_UVTSWGL00078",
    "ipId": "UVTSWGL00078",
    "technology": "4G",
    "siteType": "SA",
    "vendor": "TEJAS",
    "sdeId": "sde-narsampet",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-wl2028",
    "ssa": "WARANGAL",
    "sdca": "NARSAMPET",
    "btsId": "WL2028",
    "btsName": "B28_Gudur_WL_WL2028",
    "ipId": "WL2028",
    "technology": "4G",
    "siteType": "BS",
    "vendor": "TEJAS",
    "sdeId": "sde-narsampet",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-wl5026",
    "ssa": "WARANGAL",
    "sdca": "NARSAMPET",
    "btsId": "WL5026",
    "btsName": "B01_Narsampet_VIOM_WL5026",
    "ipId": "WL5026",
    "technology": "4G",
    "siteType": "IP",
    "vendor": "TEJAS",
    "sdeId": "sde-narsampet",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-wl2084",
    "ssa": "WARANGAL",
    "sdca": "NARSAMPET",
    "btsId": "WL2084",
    "btsName": "B01_Narsampeta II_WL2084",
    "ipId": "WL2084",
    "technology": "4G",
    "siteType": "NB",
    "vendor": "TEJAS",
    "sdeId": "sde-narsampet",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-wl2200",
    "ssa": "WARANGAL",
    "sdca": "NARSAMPET",
    "btsId": "WL2200",
    "btsName": "B28_Papaiahpeta_WL2200",
    "ipId": "WL2200",
    "technology": "4G",
    "siteType": "BS",
    "vendor": "TEJAS",
    "sdeId": "sde-narsampet",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-wl5033",
    "ssa": "WARANGAL",
    "sdca": "NARSAMPET",
    "btsId": "WL5033",
    "btsName": "B01_Gurajala_WL5033C",
    "ipId": "WL5033",
    "technology": "4G",
    "siteType": "NB",
    "vendor": "TEJAS",
    "sdeId": "sde-narsampet",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-wl5037",
    "ssa": "WARANGAL",
    "sdca": "PARKAL",
    "btsId": "WL5037",
    "btsName": "B28_AzamNagar_Indus_WL5037",
    "ipId": "WL5037",
    "technology": "4G",
    "siteType": "IP",
    "vendor": "TEJAS",
    "sdeId": "sde-parkal",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-wl2081",
    "ssa": "WARANGAL",
    "sdca": "PARKAL",
    "btsId": "WL2081",
    "btsName": "B28_Chelpur_WL2081",
    "ipId": "WL2081",
    "technology": "4G",
    "siteType": "NB",
    "vendor": "TEJAS",
    "sdeId": "sde-parkal",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  },
  {
    "id": "site-wl2143",
    "ssa": "WARANGAL",
    "sdca": "PARKAL",
    "btsId": "WL2143",
    "btsName": "338_6504_Challagarega_WL2143",
    "ipId": "WL2143",
    "technology": "3G",
    "siteType": "NB",
    "vendor": "ZTE",
    "sdeId": "sde-parkal",
    "critical": false,
    "batteryBackupHours": 0,
    "transmissionPaths": 1
  }
] satisfies Site[];

export const workbookOutageIncidents = [
  {
    "id": "inc-ts-001",
    "batchId": "ts-workbook-batch",
    "siteId": "site-uvtswgl00003",
    "btsId": "UVTSWGL00003",
    "outageDate": "2026-07-13",
    "downTime": "2026-07-13T19:36:23.000Z",
    "upTime": "2026-07-13T19:37:23.000Z",
    "durationMinutes": 1,
    "alarmCode": "5034",
    "alarmCategory": "Transmission",
    "description": "Site Down - Backhaul link down",
    "rawRecordIds": [
      "raw-ts-1"
    ],
    "major": false
  },
  {
    "id": "inc-ts-002",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2166",
    "btsId": "WL2166",
    "outageDate": "2026-07-13",
    "downTime": "2026-07-13T21:24:12.000Z",
    "upTime": "2026-07-13T21:25:13.000Z",
    "durationMinutes": 1,
    "alarmCode": "5034",
    "alarmCategory": "Transmission",
    "description": "Site Down - Backhaul link down",
    "rawRecordIds": [
      "raw-ts-2",
      "raw-ts-3"
    ],
    "major": false
  },
  {
    "id": "inc-ts-003",
    "batchId": "ts-workbook-batch",
    "siteId": "site-uvtswgl00003",
    "btsId": "UVTSWGL00003",
    "outageDate": "2026-07-13",
    "downTime": "2026-07-13T21:24:30.000Z",
    "upTime": "2026-07-13T21:25:30.000Z",
    "durationMinutes": 1,
    "alarmCode": "5034",
    "alarmCategory": "Transmission",
    "description": "Site Down - Backhaul link down",
    "rawRecordIds": [
      "raw-ts-4"
    ],
    "major": false
  },
  {
    "id": "inc-ts-004",
    "batchId": "ts-workbook-batch",
    "siteId": "site-uvtswgl00040",
    "btsId": "UVTSWGL00040",
    "outageDate": "2026-07-13",
    "downTime": "2026-07-13T21:54:39.000Z",
    "upTime": "2026-07-13T21:55:59.000Z",
    "durationMinutes": 1,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-5"
    ],
    "major": false
  },
  {
    "id": "inc-ts-005",
    "batchId": "ts-workbook-batch",
    "siteId": "site-uvtswgl00003",
    "btsId": "UVTSWGL00003",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T03:33:20.000Z",
    "upTime": "2026-07-14T03:35:49.000Z",
    "durationMinutes": 2,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-6"
    ],
    "major": false
  },
  {
    "id": "inc-ts-006",
    "batchId": "ts-workbook-batch",
    "siteId": "site-uvtswgl00003",
    "btsId": "UVTSWGL00003",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T03:40:04.000Z",
    "upTime": "2026-07-14T03:46:52.000Z",
    "durationMinutes": 6,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-7"
    ],
    "major": false
  },
  {
    "id": "inc-ts-007",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5152",
    "btsId": "WL5152",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T04:13:42.999Z",
    "upTime": "2026-07-14T04:30:15.000Z",
    "durationMinutes": 16,
    "alarmCode": "198083023",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-8"
    ],
    "major": false
  },
  {
    "id": "inc-ts-008",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5152",
    "btsId": "WL5152",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T04:34:30.000Z",
    "upTime": "2026-07-14T04:49:57.000Z",
    "durationMinutes": 15,
    "alarmCode": "198083023",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-9"
    ],
    "major": false
  },
  {
    "id": "inc-ts-009",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5152",
    "btsId": "WL5152",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T04:52:06.000Z",
    "upTime": "2026-07-14T05:06:58.000Z",
    "durationMinutes": 14,
    "alarmCode": "198083023",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-10"
    ],
    "major": false
  },
  {
    "id": "inc-ts-010",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5152",
    "btsId": "WL5152",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T05:08:57.000Z",
    "upTime": "2026-07-14T05:23:37.000Z",
    "durationMinutes": 14,
    "alarmCode": "198083023",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-11"
    ],
    "major": false
  },
  {
    "id": "inc-ts-011",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5152",
    "btsId": "WL5152",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T05:25:53.999Z",
    "upTime": "2026-07-14T05:40:27.999Z",
    "durationMinutes": 14,
    "alarmCode": "198083023",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-12"
    ],
    "major": false
  },
  {
    "id": "inc-ts-012",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5152",
    "btsId": "WL5152",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T05:42:53.000Z",
    "upTime": "2026-07-14T05:57:32.000Z",
    "durationMinutes": 14,
    "alarmCode": "198083023",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-13"
    ],
    "major": false
  },
  {
    "id": "inc-ts-013",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5152",
    "btsId": "WL5152",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T05:59:43.000Z",
    "upTime": "2026-07-14T06:14:16.999Z",
    "durationMinutes": 14,
    "alarmCode": "198083023",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-14"
    ],
    "major": false
  },
  {
    "id": "inc-ts-014",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2228",
    "btsId": "WL2228",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T06:19:37.000Z",
    "upTime": "2026-07-14T06:29:07.000Z",
    "durationMinutes": 9,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-15"
    ],
    "major": false
  },
  {
    "id": "inc-ts-015",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5152",
    "btsId": "WL5152",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T06:16:34.000Z",
    "upTime": "2026-07-14T06:31:13.000Z",
    "durationMinutes": 14,
    "alarmCode": "198083023",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-16"
    ],
    "major": false
  },
  {
    "id": "inc-ts-016",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2228",
    "btsId": "WL2228",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T06:29:07.000Z",
    "upTime": "2026-07-14T06:32:25.000Z",
    "durationMinutes": 3,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - RAC App Unreachable",
    "rawRecordIds": [
      "raw-ts-17"
    ],
    "major": false
  },
  {
    "id": "inc-ts-017",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2025",
    "btsId": "WL2025",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T06:25:56.999Z",
    "upTime": "2026-07-14T06:36:12.000Z",
    "durationMinutes": 10,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-18"
    ],
    "major": false
  },
  {
    "id": "inc-ts-018",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2025",
    "btsId": "WL2025",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T06:36:12.000Z",
    "upTime": "2026-07-14T06:38:40.000Z",
    "durationMinutes": 2,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - RAC App Unreachable",
    "rawRecordIds": [
      "raw-ts-19"
    ],
    "major": false
  },
  {
    "id": "inc-ts-019",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2228",
    "btsId": "WL2228",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T06:33:04.000Z",
    "upTime": "2026-07-14T06:40:05.000Z",
    "durationMinutes": 7,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-20"
    ],
    "major": false
  },
  {
    "id": "inc-ts-020",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2025",
    "btsId": "WL2025",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T06:39:19.999Z",
    "upTime": "2026-07-14T06:46:27.000Z",
    "durationMinutes": 7,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-21"
    ],
    "major": false
  },
  {
    "id": "inc-ts-021",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5152",
    "btsId": "WL5152",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T06:33:23.000Z",
    "upTime": "2026-07-14T06:46:42.000Z",
    "durationMinutes": 13,
    "alarmCode": "198083023",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-22"
    ],
    "major": false
  },
  {
    "id": "inc-ts-022",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5153",
    "btsId": "WL5153",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T06:56:32.999Z",
    "upTime": "2026-07-14T07:00:02.000Z",
    "durationMinutes": 3,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-23"
    ],
    "major": false
  },
  {
    "id": "inc-ts-023",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5046",
    "btsId": "WL5046",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T06:52:48.000Z",
    "upTime": "2026-07-14T07:06:39.999Z",
    "durationMinutes": 13,
    "alarmCode": "198087337",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-24"
    ],
    "major": false
  },
  {
    "id": "inc-ts-024",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5153",
    "btsId": "WL5153",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T07:03:20.000Z",
    "upTime": "2026-07-14T07:09:58.000Z",
    "durationMinutes": 6,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-25"
    ],
    "major": false
  },
  {
    "id": "inc-ts-025",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5046",
    "btsId": "WL5046",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T06:58:01.999Z",
    "upTime": "2026-07-14T07:14:24.000Z",
    "durationMinutes": 16,
    "alarmCode": "7786",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-26"
    ],
    "major": false
  },
  {
    "id": "inc-ts-026",
    "batchId": "ts-workbook-batch",
    "siteId": "site-uvtswgl00011",
    "btsId": "UVTSWGL00011",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T07:54:31.000Z",
    "upTime": "2026-07-14T07:55:31.000Z",
    "durationMinutes": 1,
    "alarmCode": "5034",
    "alarmCategory": "Transmission",
    "description": "Site Down - Backhaul link down",
    "rawRecordIds": [
      "raw-ts-27"
    ],
    "major": false
  },
  {
    "id": "inc-ts-027",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5153",
    "btsId": "WL5153",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T08:40:35.000Z",
    "upTime": "2026-07-14T09:40:20.000Z",
    "durationMinutes": 59,
    "alarmCode": "198087337",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-28"
    ],
    "major": false
  },
  {
    "id": "inc-ts-028",
    "batchId": "ts-workbook-batch",
    "siteId": "site-uvtswgl00008",
    "btsId": "UVTSWGL00008",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T03:37:57.000Z",
    "upTime": "2026-07-14T09:40:53.000Z",
    "durationMinutes": 362,
    "alarmCode": "5034",
    "alarmCategory": "Power",
    "description": "Site Down - Network/Power/Controller Unreachable - Aggregation Site Issue",
    "rawRecordIds": [
      "raw-ts-29",
      "raw-ts-30"
    ],
    "major": true
  },
  {
    "id": "inc-ts-029",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5152",
    "btsId": "WL5152",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T08:47:10.000Z",
    "upTime": "2026-07-14T09:45:47.000Z",
    "durationMinutes": 58,
    "alarmCode": "198083023",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-31"
    ],
    "major": false
  },
  {
    "id": "inc-ts-030",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5153",
    "btsId": "WL5153",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T08:45:46.000Z",
    "upTime": "2026-07-14T09:46:14.000Z",
    "durationMinutes": 60,
    "alarmCode": "7786",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-32"
    ],
    "major": false
  },
  {
    "id": "inc-ts-031",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5153",
    "btsId": "WL5153",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T09:50:49.999Z",
    "upTime": "2026-07-14T10:01:23.000Z",
    "durationMinutes": 10,
    "alarmCode": "5034",
    "alarmCategory": "Power",
    "description": "Site Down - Network/Power/Controller Unreachable",
    "rawRecordIds": [
      "raw-ts-33",
      "raw-ts-34"
    ],
    "major": false
  },
  {
    "id": "inc-ts-032",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5153",
    "btsId": "WL5153",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T09:42:13.000Z",
    "upTime": "2026-07-14T10:01:57.000Z",
    "durationMinutes": 19,
    "alarmCode": "198087337",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-35"
    ],
    "major": false
  },
  {
    "id": "inc-ts-033",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5153",
    "btsId": "WL5153",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T10:01:23.000Z",
    "upTime": "2026-07-14T10:02:50.000Z",
    "durationMinutes": 1,
    "alarmCode": "5034",
    "alarmCategory": "Transmission",
    "description": "Site Down - Backhaul link down",
    "rawRecordIds": [
      "raw-ts-36"
    ],
    "major": false
  },
  {
    "id": "inc-ts-034",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5153",
    "btsId": "WL5153",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T10:03:54.000Z",
    "upTime": "2026-07-14T10:04:54.000Z",
    "durationMinutes": 1,
    "alarmCode": "5034",
    "alarmCategory": "Transmission",
    "description": "Site Down - Backhaul link down",
    "rawRecordIds": [
      "raw-ts-37"
    ],
    "major": false
  },
  {
    "id": "inc-ts-035",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5152",
    "btsId": "WL5152",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T09:48:45.000Z",
    "upTime": "2026-07-14T10:07:24.000Z",
    "durationMinutes": 18,
    "alarmCode": "198083023",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-38"
    ],
    "major": false
  },
  {
    "id": "inc-ts-036",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5153",
    "btsId": "WL5153",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T09:47:22.000Z",
    "upTime": "2026-07-14T10:07:38.000Z",
    "durationMinutes": 20,
    "alarmCode": "7786",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-39"
    ],
    "major": false
  },
  {
    "id": "inc-ts-037",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5153",
    "btsId": "WL5153",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T10:02:40.999Z",
    "upTime": "2026-07-14T10:11:18.000Z",
    "durationMinutes": 8,
    "alarmCode": "198087337",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-40"
    ],
    "major": false
  },
  {
    "id": "inc-ts-038",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5152",
    "btsId": "WL5152",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T10:09:15.000Z",
    "upTime": "2026-07-14T10:17:00.000Z",
    "durationMinutes": 7,
    "alarmCode": "198083023",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-41"
    ],
    "major": false
  },
  {
    "id": "inc-ts-039",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5153",
    "btsId": "WL5153",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T10:07:59.999Z",
    "upTime": "2026-07-14T10:17:06.000Z",
    "durationMinutes": 9,
    "alarmCode": "7786",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-42"
    ],
    "major": false
  },
  {
    "id": "inc-ts-040",
    "batchId": "ts-workbook-batch",
    "siteId": "site-uvtswgl00039",
    "btsId": "UVTSWGL00039",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T09:50:49.999Z",
    "upTime": "2026-07-14T11:15:40.000Z",
    "durationMinutes": 84,
    "alarmCode": "5034",
    "alarmCategory": "Power",
    "description": "Site Down - Network/Power/Controller Unreachable",
    "rawRecordIds": [
      "raw-ts-43"
    ],
    "major": true
  },
  {
    "id": "inc-ts-041",
    "batchId": "ts-workbook-batch",
    "siteId": "site-uvtswgl00040",
    "btsId": "UVTSWGL00040",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T09:50:49.999Z",
    "upTime": "2026-07-14T11:16:02.000Z",
    "durationMinutes": 85,
    "alarmCode": "5034",
    "alarmCategory": "Power",
    "description": "Site Down - Network/Power/Controller Unreachable",
    "rawRecordIds": [
      "raw-ts-44"
    ],
    "major": true
  },
  {
    "id": "inc-ts-042",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5046",
    "btsId": "WL5046",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T07:00:54.999Z",
    "upTime": "2026-07-14T12:53:27.000Z",
    "durationMinutes": 352,
    "alarmCode": "5034",
    "alarmCategory": "Power",
    "description": "Site Down - Network/Power/Controller Unreachable - Other SSA OFC Break",
    "rawRecordIds": [
      "raw-ts-45",
      "raw-ts-46"
    ],
    "major": true
  },
  {
    "id": "inc-ts-043",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5046",
    "btsId": "WL5046",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T07:10:25.000Z",
    "upTime": "2026-07-14T12:54:03.000Z",
    "durationMinutes": 343,
    "alarmCode": "198087337",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-47"
    ],
    "major": true
  },
  {
    "id": "inc-ts-044",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5046",
    "btsId": "WL5046",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T07:15:39.000Z",
    "upTime": "2026-07-14T13:00:09.000Z",
    "durationMinutes": 344,
    "alarmCode": "7786",
    "alarmCategory": "OFC",
    "description": "Other SSA OFC Break",
    "rawRecordIds": [
      "raw-ts-48"
    ],
    "major": true
  },
  {
    "id": "inc-ts-045",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5153",
    "btsId": "WL5153",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T15:06:57.000Z",
    "upTime": "2026-07-14T15:07:56.999Z",
    "durationMinutes": 1,
    "alarmCode": "5034",
    "alarmCategory": "Transmission",
    "description": "Site Down - Backhaul link down",
    "rawRecordIds": [
      "raw-ts-49"
    ],
    "major": false
  },
  {
    "id": "inc-ts-046",
    "batchId": "ts-workbook-batch",
    "siteId": "site-uvtswgl00154",
    "btsId": "UVTSWGL00154",
    "outageDate": "2026-07-13",
    "downTime": "2026-07-13T19:41:43.999Z",
    "upTime": "2026-07-14T01:09:48.000Z",
    "durationMinutes": 328,
    "alarmCode": "5034",
    "alarmCategory": "Power",
    "description": "Site Down - Network/Power/Controller Unreachable",
    "rawRecordIds": [
      "raw-ts-50",
      "raw-ts-51"
    ],
    "major": true
  },
  {
    "id": "inc-ts-047",
    "batchId": "ts-workbook-batch",
    "siteId": "site-uvtswgl00154",
    "btsId": "UVTSWGL00154",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T01:10:29.000Z",
    "upTime": "2026-07-14T01:16:43.000Z",
    "durationMinutes": 6,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-52",
      "raw-ts-53"
    ],
    "major": false
  },
  {
    "id": "inc-ts-048",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2041",
    "btsId": "WL2041",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T06:19:20.000Z",
    "upTime": "2026-07-14T06:21:48.000Z",
    "durationMinutes": 2,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-54"
    ],
    "major": false
  },
  {
    "id": "inc-ts-049",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2041",
    "btsId": "WL2041",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T06:29:08.999Z",
    "upTime": "2026-07-14T06:32:16.000Z",
    "durationMinutes": 3,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - RAC App Unreachable",
    "rawRecordIds": [
      "raw-ts-55"
    ],
    "major": false
  },
  {
    "id": "inc-ts-050",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2041",
    "btsId": "WL2041",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T06:32:54.999Z",
    "upTime": "2026-07-14T06:39:45.000Z",
    "durationMinutes": 6,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-56"
    ],
    "major": false
  },
  {
    "id": "inc-ts-051",
    "batchId": "ts-workbook-batch",
    "siteId": "site-uvtswgl00062",
    "btsId": "UVTSWGL00062",
    "outageDate": "2026-07-13",
    "downTime": "2026-07-13T23:35:06.000Z",
    "upTime": "2026-07-13T23:36:06.999Z",
    "durationMinutes": 1,
    "alarmCode": "5034",
    "alarmCategory": "Transmission",
    "description": "Site Down - Backhaul link down",
    "rawRecordIds": [
      "raw-ts-57",
      "raw-ts-58"
    ],
    "major": false
  },
  {
    "id": "inc-ts-052",
    "batchId": "ts-workbook-batch",
    "siteId": "site-uvtswgl00078",
    "btsId": "UVTSWGL00078",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T01:17:01.000Z",
    "upTime": "2026-07-14T01:21:29.000Z",
    "durationMinutes": 4,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-59"
    ],
    "major": false
  },
  {
    "id": "inc-ts-053",
    "batchId": "ts-workbook-batch",
    "siteId": "site-uvtswgl00078",
    "btsId": "UVTSWGL00078",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T01:23:49.000Z",
    "upTime": "2026-07-14T01:30:47.000Z",
    "durationMinutes": 6,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-60"
    ],
    "major": false
  },
  {
    "id": "inc-ts-054",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2028",
    "btsId": "WL2028",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T03:31:14.000Z",
    "upTime": "2026-07-14T03:37:17.000Z",
    "durationMinutes": 6,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-61"
    ],
    "major": false
  },
  {
    "id": "inc-ts-055",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2028",
    "btsId": "WL2028",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T03:38:01.000Z",
    "upTime": "2026-07-14T03:44:57.000Z",
    "durationMinutes": 6,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-62"
    ],
    "major": false
  },
  {
    "id": "inc-ts-056",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2028",
    "btsId": "WL2028",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T06:18:49.000Z",
    "upTime": "2026-07-14T06:19:48.999Z",
    "durationMinutes": 1,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-63"
    ],
    "major": false
  },
  {
    "id": "inc-ts-057",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2028",
    "btsId": "WL2028",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T06:29:08.999Z",
    "upTime": "2026-07-14T06:31:40.999Z",
    "durationMinutes": 2,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - RAC App Unreachable",
    "rawRecordIds": [
      "raw-ts-64"
    ],
    "major": false
  },
  {
    "id": "inc-ts-058",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2028",
    "btsId": "WL2028",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T06:32:21.999Z",
    "upTime": "2026-07-14T06:39:42.000Z",
    "durationMinutes": 7,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-65"
    ],
    "major": false
  },
  {
    "id": "inc-ts-059",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5026",
    "btsId": "WL5026",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T07:02:04.000Z",
    "upTime": "2026-07-14T07:06:31.000Z",
    "durationMinutes": 4,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-66"
    ],
    "major": false
  },
  {
    "id": "inc-ts-060",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5026",
    "btsId": "WL5026",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T07:08:52.000Z",
    "upTime": "2026-07-14T07:15:05.000Z",
    "durationMinutes": 6,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-67"
    ],
    "major": false
  },
  {
    "id": "inc-ts-061",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2084",
    "btsId": "WL2084",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T08:06:33.000Z",
    "upTime": "2026-07-14T08:10:58.000Z",
    "durationMinutes": 4,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-68"
    ],
    "major": false
  },
  {
    "id": "inc-ts-062",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2084",
    "btsId": "WL2084",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T08:13:18.000Z",
    "upTime": "2026-07-14T08:17:57.999Z",
    "durationMinutes": 4,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-69"
    ],
    "major": false
  },
  {
    "id": "inc-ts-063",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2200",
    "btsId": "WL2200",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T10:16:57.999Z",
    "upTime": "2026-07-14T10:17:57.999Z",
    "durationMinutes": 1,
    "alarmCode": "5034",
    "alarmCategory": "Power",
    "description": "Site Down - Network/Power/Controller Unreachable",
    "rawRecordIds": [
      "raw-ts-70"
    ],
    "major": false
  },
  {
    "id": "inc-ts-064",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2200",
    "btsId": "WL2200",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T10:16:57.999Z",
    "upTime": "2026-07-14T10:18:10.999Z",
    "durationMinutes": 1,
    "alarmCode": "5034",
    "alarmCategory": "Power",
    "description": "Site Down - Network/Power/Controller Unreachable",
    "rawRecordIds": [
      "raw-ts-71"
    ],
    "major": false
  },
  {
    "id": "inc-ts-065",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2200",
    "btsId": "WL2200",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T10:21:23.000Z",
    "upTime": "2026-07-14T10:22:23.000Z",
    "durationMinutes": 1,
    "alarmCode": "5034",
    "alarmCategory": "Transmission",
    "description": "Site Down - Backhaul link down",
    "rawRecordIds": [
      "raw-ts-72",
      "raw-ts-73"
    ],
    "major": false
  },
  {
    "id": "inc-ts-066",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5033",
    "btsId": "WL5033",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T16:39:27.999Z",
    "upTime": "2026-07-14T16:41:35.000Z",
    "durationMinutes": 2,
    "alarmCode": "5034",
    "alarmCategory": "Transmission",
    "description": "Site Down - Backhaul link down",
    "rawRecordIds": [
      "raw-ts-74"
    ],
    "major": false
  },
  {
    "id": "inc-ts-067",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5033",
    "btsId": "WL5033",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T16:38:39.000Z",
    "upTime": "2026-07-14T16:41:55.000Z",
    "durationMinutes": 3,
    "alarmCode": "5034",
    "alarmCategory": "Transmission",
    "description": "Site Down - Backhaul link down",
    "rawRecordIds": [
      "raw-ts-75"
    ],
    "major": false
  },
  {
    "id": "inc-ts-068",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5033",
    "btsId": "WL5033",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T18:22:44.000Z",
    "upTime": "2026-07-14T18:23:45.000Z",
    "durationMinutes": 1,
    "alarmCode": "5034",
    "alarmCategory": "Transmission",
    "description": "Site Down - Backhaul link down",
    "rawRecordIds": [
      "raw-ts-76"
    ],
    "major": false
  },
  {
    "id": "inc-ts-069",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl5037",
    "btsId": "WL5037",
    "outageDate": "2026-07-13",
    "downTime": "2026-07-13T15:57:07.000Z",
    "upTime": "2026-07-14T02:27:05.000Z",
    "durationMinutes": 629,
    "alarmCode": "5034",
    "alarmCategory": "Power",
    "description": "Site Down - Network/Power/Controller Unreachable - SSA OFC Break",
    "rawRecordIds": [
      "raw-ts-77",
      "raw-ts-78"
    ],
    "major": true
  },
  {
    "id": "inc-ts-070",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2081",
    "btsId": "WL2081",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T06:54:10.999Z",
    "upTime": "2026-07-14T06:58:37.000Z",
    "durationMinutes": 4,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-79"
    ],
    "major": false
  },
  {
    "id": "inc-ts-071",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2081",
    "btsId": "WL2081",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T07:00:58.999Z",
    "upTime": "2026-07-14T07:07:30.000Z",
    "durationMinutes": 6,
    "alarmCode": "5034",
    "alarmCategory": "Other",
    "description": "Site Down - All Sector Down",
    "rawRecordIds": [
      "raw-ts-80"
    ],
    "major": false
  },
  {
    "id": "inc-ts-072",
    "batchId": "ts-workbook-batch",
    "siteId": "site-wl2143",
    "btsId": "WL2143",
    "outageDate": "2026-07-14",
    "downTime": "2026-07-14T10:14:01.000Z",
    "upTime": "2026-07-14T10:26:38.000Z",
    "durationMinutes": 12,
    "alarmCode": "198083023",
    "alarmCategory": "Other",
    "description": "",
    "rawRecordIds": [
      "raw-ts-81"
    ],
    "major": false
  }
] satisfies OutageIncident[];
