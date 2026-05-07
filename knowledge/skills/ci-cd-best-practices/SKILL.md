---
name: ci-cd-best-practices
description: Apply Dedalus CI/CD workflow rules for runner placement, Docker build verification, artifact publication, and self-hosted runner orchestration. Use when editing GitHub Actions workflows, Docker build pipelines, deploy jobs, Terraform/ECS/Flux workflows, or self-hosted runner automation.
---

# CI/CD Best Practices

## Runner placement

Choose the cheapest runner that matches the job's real bottleneck.

### `ubuntu-24.04`

Use for I/O-bound or orchestration-heavy jobs:

- git / GitHub API orchestration
- AWS/Terraform apply jobs that do not compile code
- artifact upload/download
- release-please
- branch promotion and audit tagging
- Copybara sync jobs
- IAM preflight / policy simulation
- ECS force deploy
- link checking
- small lint/validation jobs that do not build or test significant code
- self-hosted runner provision / cleanup control jobs

### `blacksmith-4vcpu-ubuntu-2404`

Use for compute-bound jobs:

- Docker builds
- Rust / Go / Python / TypeScript builds
- unit, integration, and end-to-end tests
- typechecking over real codebases
- static analysis that scans large codebases (for example Semgrep)
- Kind / KWOK / Chaos / stress workloads
- anything that spends real time compiling, bundling, or executing test suites

### self-hosted AWS runners

Use only when GitHub-hosted runners cannot do the job:

- KVM / nested virtualization
- ARM64-native builds that must run on our own infrastructure
- privileged or hardware-specific workloads
- deploy jobs whose payload must run inside the target architecture/runtime

If the job is only provisioning or cleaning up the self-hosted runner, run
that control job on `ubuntu-24.04`. Only the payload belongs on self-hosted.

## Docker artifact policy

### PR CI

Every deployable image must be built in CI with `push: false`.

Rules:

- CD must never be the first place a Dockerfile runs
- do not push unreviewed application images to ECR from pull requests
- verify the exact Dockerfile, build context, and target platform the CD workflow uses
- make CI gates and CD path filters cover every file copied into that Docker build context
- if the Dockerfile depends on private ECR base images, log in only for pull
  access; still keep `push: false`

### merge / branch CD

After merge, CD may build and publish the application image for the merged
commit.

Current repo rule:

- PRs verify builds
- merged branches publish images

If you later refactor a service toward true build-once/deploy-later, keep the
same invariant: no unreviewed artifact is written to ECR.

## Workflow structure

Prefer these shapes:

1. `verify-build` in CI
2. `publish` in CD
3. `deploy/apply` in CD

Split build from deploy when runner classes differ. A pure Terraform/ECS apply
job should not stay on Blacksmith just because the build job in the same
workflow needs it.

Use reusable workflows for generic behavior. Use service-specific wrapper
workflows when a service needs custom setup such as:

- private base image bootstrap
- extra build contexts
- special build arguments
- architecture-specific setup

## Self-hosted runner guidance

Prefer server-side runner registration when the platform supports it.

For GitHub Actions runners:

- prefer JIT runner configuration over registration-token plus polling loops
- avoid scanning the runner list in a retry loop when the API can return the
  runner identity directly
- keep provisioning and cleanup logic separate from the payload job

## Validation

After editing workflows:

1. Run `actionlint`
2. Check that cheap jobs use `ubuntu-24.04`
3. Check that builds/tests remain on Blacksmith or self-hosted
4. Confirm PR image verification uses `push: false`
5. Confirm CD still publishes only from merged branches or explicit deploy
   triggers
