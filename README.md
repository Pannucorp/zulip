# Zulip overview

Zulip is a powerful, open source group chat application that combines the
immediacy of real-time chat with the productivity benefits of threaded
conversations. Zulip is used by open source projects, Fortune 500 companies,
large standards bodies, and others who need a real-time chat system that
allows users to easily process hundreds or thousands of messages a day. With
over 700 contributors merging over 500 commits a month, Zulip is also the
largest and fastest growing open source group chat project.

[![GitHub Actions build status](https://github.com/zulip/zulip/actions/workflows/zulip-ci.yml/badge.svg)](https://github.com/zulip/zulip/actions/workflows/zulip-ci.yml?query=branch%3Amain)
[![coverage status](https://img.shields.io/codecov/c/github/zulip/zulip/main.svg)](https://codecov.io/gh/zulip/zulip)
[![Mypy coverage](https://img.shields.io/badge/mypy-100%25-green.svg)][mypy-coverage]
[![code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![GitHub release](https://img.shields.io/github/release/zulip/zulip.svg)](https://github.com/zulip/zulip/releases/latest)
[![docs](https://readthedocs.org/projects/zulip/badge/?version=latest)](https://zulip.readthedocs.io/en/latest/)
[![Zulip chat](https://img.shields.io/badge/zulip-join_chat-brightgreen.svg)](https://chat.zulip.org)
[![Twitter](https://img.shields.io/badge/twitter-@zulip-blue.svg?style=flat)](https://twitter.com/zulip)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/zulip)](https://github.com/sponsors/zulip)

[mypy-coverage]: https://blog.zulip.org/2016/10/13/static-types-in-python-oh-mypy/

## Getting started

Click on the appropriate link below. If nothing seems to apply,
join us on the
[Zulip community server](https://zulip.com/developer-community/)
and tell us what's up!

You might be interested in:

- **Contributing code**. Check out our
  [guide for new contributors](https://zulip.readthedocs.io/en/latest/overview/contributing.html)
  to get started. Zulip prides itself on maintaining a clean and
  well-tested codebase, and a stock of hundreds of
  [beginner-friendly issues][beginner-friendly].

- **Contributing non-code**.
  [Report an issue](https://zulip.readthedocs.io/en/latest/overview/contributing.html#reporting-issues),
  [translate](https://zulip.readthedocs.io/en/latest/translating/translating.html) Zulip
  into your language,
  [write](https://zulip.readthedocs.io/en/latest/overview/contributing.html#zulip-outreach)
  for the Zulip blog, or
  [give us feedback](https://zulip.readthedocs.io/en/latest/overview/contributing.html#user-feedback). We
  would love to hear from you, even if you're just trying the product out.

- **Supporting Zulip**. Advocate for your organization to use Zulip, become a [sponsor](https://github.com/sponsors/zulip), write a
  review in the mobile app stores, or
  [upvote Zulip](https://zulip.readthedocs.io/en/latest/overview/contributing.html#zulip-outreach) on
  product comparison sites.

- **Checking Zulip out**. The best way to see Zulip in action is to drop by
  the
  [Zulip community server](https://zulip.com/developer-community/). We
  also recommend reading Zulip for
  [open source](https://zulip.com/for/open-source/), Zulip for
  [companies](https://zulip.com/for/companies/), or Zulip for
  [communities](https://zulip.com/for/working-groups-and-communities/).

- **Running a Zulip server**. Use a preconfigured [DigitalOcean droplet](https://marketplace.digitalocean.com/apps/zulip),
  [install Zulip](https://zulip.readthedocs.io/en/stable/production/install.html)
  directly, or use Zulip's
  experimental [Docker image](https://zulip.readthedocs.io/en/latest/production/deployment.html#zulip-in-docker).
  Commercial support is available; see <https://zulip.com/plans> for details.

- **Using Zulip without setting up a server**. <https://zulip.com>
  offers free and commercial hosting, including providing our paid
  plan for free to fellow open source projects.

- **Participating in [outreach
  programs](https://zulip.readthedocs.io/en/latest/overview/contributing.html#outreach-programs)**
  like Google Summer of Code.

You may also be interested in reading our [blog](https://blog.zulip.org/) or
following us on [Twitter](https://twitter.com/zulip).
Zulip is distributed under the
[Apache 2.0](https://github.com/zulip/zulip/blob/main/LICENSE) license.

[beginner-friendly]: https://github.com/zulip/zulip/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22

# Production Setup Step

1. domain
2. redis, setup password
3. run command
   sudo ./scripts/setup/install --certbot --email=yuji.j@pannucorp.com --hostname=zulip-test.pannucorp.com

# Docker Setup Step

1. Build docker image in local
   tools/ci/build-docker-images
2. push->github action: production-suite, zulip-ci
   workflows/production-suite

# Reinstall guide

sudo service nginx stop
sudo rm -rf /etc/zulip /var/log/zulip /home/zulip/* /srv/zulip-*
sudo rm -rf /home/ubuntu/workspace/zulip
sudo git clone -b pwa2 https://github.com/pannucorp/zulip
sudo ./scripts/setup/install --certbot --email=yuji.j@pannucorp.com --hostname=zulip-test.pannucorp.com