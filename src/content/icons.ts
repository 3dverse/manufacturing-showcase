import {
    faBoltLightning,
    faCog,
    faDashboard,
    faGraduationCap,
    faPalette,
    faScrewdriverWrench,
    faShieldHalved,
} from "@fortawesome/sharp-light-svg-icons";
import {
    faScrewdriverWrench as faScrewdriverWrenchSolid,
    faShieldHalved as faShieldHalvedSolid,
    faBoltLightning as faBoltLightningSolid,
    faGraduationCap as faGraduationCapSolid,
    faPalette as faPaletteSolid,
    faCog as faCogSolid,
    faDashboard as faDashboardSolid,
} from "@fortawesome/pro-solid-svg-icons";

//------------------------------------------------------------------------------
export const dashboardIcon = { light: faDashboard, solid: faDashboardSolid };
export const maintenanceIcon = { light: faScrewdriverWrench, solid: faScrewdriverWrenchSolid };
export const securityIcon = { light: faShieldHalved, solid: faShieldHalvedSolid };
export const energyIcon = { light: faBoltLightning, solid: faBoltLightningSolid };
export const trainingIcon = { light: faGraduationCap, solid: faGraduationCapSolid };
export const themeIcon = { light: faPalette, solid: faPaletteSolid };
export const settingsIcon = { light: faCog, solid: faCogSolid };

export const mainMenuIcons = {
    dashboard: dashboardIcon,
    maintenance: maintenanceIcon,
    security: securityIcon,
    energy: energyIcon,
    training: trainingIcon,
    theme: themeIcon,
    settings: settingsIcon,
};
