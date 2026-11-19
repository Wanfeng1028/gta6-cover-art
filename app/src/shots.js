// Fixed scenes for screenshots, driven by the query string:
//
//   ?shot=editor&photo=pier&caption=Sunset%20Heist
//       the editor with a sample photo loaded into every panel.
//   ?shot=cover&photo=boulevard&caption=Boulevard%20Queen&size=portrait
//       the cover alone, full-bleed, at the requested export size.
//
// `photo` names a sample (pier or boulevard), `caption` the title words,
// `size` one of square, portrait or wide, `layout` poster or grid.
// window.__shotReady is set once the scene has painted, so a screenshot
// script knows when to shoot.
export async function applyShotQuery(query, api) {
  const shot = query.get("shot");
  const photo = query.get("photo") ?? "pier";
  const caption = query.get("caption") ?? "Sunset Heist";
  const subtitle = query.get("subtitle") ?? undefined;
  const size = query.get("size") ?? undefined;
  const layout = query.get("layout") ?? undefined;
  const grade = query.get("grade") ?? undefined;

  if (size) api.setSize(size);
  if (layout) api.setLayout(layout);
  if (subtitle) api.setSubtitle(subtitle);
  if (grade) api.setGrade(grade);
  api.setTitle(caption);

  const id = await api.loadSamplePhoto(photo);
  api.fillAllPanels(id);
  api.varyCrops();

  if (shot === "cover") api.coverOnly();
  api.refresh();
  api.markReady();
}
