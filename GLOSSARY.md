# Oidrune Glossary

Oidrune's release and delivery vocabulary. These terms describe the product boundary and do not prescribe a particular implementation.

## Release

**Release Target**:
The single owner-selected intent for a release: a `patch`, `minor`, or `major` bump, or an explicit final `X.Y.Z` version.
_Avoid_: PR release label, run-number version

**Canonical Version**:
The complete final version resolved from a Release Target and the Trusted Final Baseline.
_Avoid_: Candidate version, next PR version

**Trusted Final Baseline**:
The latest verified stable version from which a new Canonical Version is ordered.
_Avoid_: Current branch version, latest workflow run

**Release Identity**:
The immutable association between the Release Target, Canonical Version, source commit, and published release boundary.
_Avoid_: Release intent, PR metadata

**Release**:
The act of publishing one Release Identity as an immutable versioned product boundary.
_Avoid_: Deploy, merge

**Deploy**:
The act of applying the already published Release Identity to its runtime surface.
_Avoid_: Release, build

**Same-Identity Recovery**:
A retry that completes missing Release or Deploy work for an existing Release Identity without assigning a new version or source.
_Avoid_: Retry with next version, backfill release
