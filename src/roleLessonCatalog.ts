/** The player chooses each chapter; animation time never advances the lesson. */
export const roleChapters:Record<string,string[]>={
 employee:['meeting'],
 manager:['gather','discuss','dismiss','resume'],
 security:['alert','scan','money','failure','clear','share'],
 gambler:['steal','cashout','wheel','loss','shop','goal'],
};
export const ROLE_CHAPTER_SECONDS=10;
// The player now uses supplied full-length films; chapter data above remains for source renders.
export const ROLE_FILM_VERSION='provided-20261028';
