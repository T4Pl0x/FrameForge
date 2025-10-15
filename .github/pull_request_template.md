# Publish: <app_name> @ <versionId>

## Required
- Spec version: **<versionId>**
- Artifact: **<artifactId>**
- Spec sections touched (links):  
  - [ ] UI (`/spec/ui.json` paths: …)  
  - [ ] Overlays (`/spec/overlays.json` paths: …)  
  - [ ] Logic (`/spec/logic.json` paths: …)  
  - [ ] Data mocks (`/spec/data.json` paths: …)  
  - [ ] Theme/Animations (packs)


## FrameForge
- Spec version: **<versionId>**
- Artifact: **<artifactId>**
- Gates: preflight=<pass/fail>, tests=<pass/fail>, a11y=<pass/fail>, lintBuild=<pass/fail>, risk=<level>

## Reports
- Tests: ✅ / 🔴  (attach summary link)
- A11y: ✅ / 🔶 (waivers listed)
- Lint/Build: ✅
- SBOM / Secret scan: ✅

## Risk
- [ ] Low (generated regions only)  
- [ ] Override (reason required):

Notes
- Visual runtime spec bundle is canonical. Generated code is read-only.


## Override (if used)
- [ ] Owner requested override
- Reason: …
- Expires: …
