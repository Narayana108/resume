/**
 * Single source of truth for all resume content.
 * Nothing here is fetched or generated — edit this file to change the resume.
 */

export const site = {
  name: 'Nārāyaṇa Dās Harricharaṇ',
  role: 'Senior DevOps / Platform Engineer',
  tagline: ['DevOps', 'Full-Stack Development', 'AI Systems'],
  email: { user: 'narayan-das', domain: 'tuta', tld: 'io' },
  github: 'https://github.com/Narayana108/',
  githubLabel: 'github.com/Narayana108',
  location: 'India (GMT+5:30)',
  resumeFile: './Nārāyaṇa - DevOps Engineer - Resume.pdf',
  website: 'https://github.com/Narayana108/resume',
  facts: [
    { label: 'Date of birth', value: '25/08/1993' },
    { label: 'Nationality', value: 'South African' },
    { label: 'Current location', value: 'India (GMT+5:30)' },
    { label: 'Languages', value: 'English, Afrikaans, Hindi and Sanskrit' }
  ]
};

export const profile = {
  /**
   * Radar axes for the interactive Profile section. `value` is a
   * self-assessment on a 0–1 scale, not a measurement — the shape is meant to
   * read as broad rather than spiky.
   */
  axes: [
    { label: 'AI & Agents', value: 4 },
    { label: 'Backend', value: 4 },
    { label: 'Frontend', value: 3 },
    { label: 'Cloud & Infra', value: 5 },
    { label: 'Scaling & Ops', value: 5 },
    { label: 'CI/CD', value: 5 }
  ],
  points: [
    {
      label: 'Senior DevOps / Platform Engineer',
      text: '8+ years of experience designing, building and operating production infrastructure and cloud platforms.'
    },
    {
      label: 'Full-Stack Development',
      text: 'Hands-on experience developing applications across backend and frontend.'
    },
    {
      label: 'AI-Enabled Engineering',
      text: 'Practical experience with modern LLMs and coding agents, leveraging AI to extend full-stack development capabilities and deliver high-quality software efficiently.'
    }
  ],
  closing: {
    lead: 'Together, these capabilities enable me to operate as an',
    emphasis: 'AI-empowered, full-spectrum engineer',
    tail: ', working across the entire technology stack.'
  }
};

export const skills = [
  {
    label: 'Cloud & Systems',
    text: 'AWS (EC2, S3, Route 53, CloudWatch), Google Cloud (GKE), DigitalOcean, Debian, Ubuntu, CentOS, Alpine Linux.'
  },
  {
    label: 'Containers & Virtualisation',
    text: 'Kubernetes, Docker, Docker Swarm, Helm, Incus, KVM, Vagrant, VirtualBox, GlusterFS.'
  },
  {
    label: 'Automation & CI/CD',
    text: 'Ansible, Puppet, Jenkins, Bitbucket Pipelines, Git, GitLab.'
  },
  {
    label: 'Development',
    text: 'Python, Bash, Go, Ruby, TypeScript, Node.js.'
  },
  {
    label: 'Networking, Data & Observability',
    text: 'TCP/IP, DNS, TLS/SSL, load balancing, SSH, PostgreSQL, MySQL, CockroachDB, MongoDB, Redis, Prometheus, Grafana, ELK.'
  },
  {
    label: 'AI & Agent Systems',
    text: 'llama.cpp and forks, Strata, Unsloth, local LLM benchmarking, inference runtimes, model quantisation, fine-tuning workflows, sovereign/self-hosted AI solutions, Herdr, OMP, Odysseus, isolated agent environments.'
  }
];
export const experience = [
  {
    title: 'Independent Cloud & Platform Engineer',
    subtitle: 'Infrastructure Engineering, DevOps Automation & AI Systems',
    date: 'Jan 2026 - Present',
    bullets: [
      'Building Debian server automation with Ansible and an Incus-based WordPress hosting platform.',
      'Developing repeatable infrastructure testing and configuration with Vagrant.',
      'Benchmarking LLMs, inference engines and coding-agent harnesses; experimenting with parallel agents using Herdr.'
    ],
    projects: [
      { label: 'Debian Server Baseline', href: 'https://github.com/Mantrium/debian-server-baseline' },
      { label: 'Ansible GitLab Cluster', href: 'https://github.com/Narayana108/ha-gitlab-server-ansible' },
      { label: 'GitHub', href: 'https://github.com/Narayana108/' }
    ]
  },
  {
    title: 'Independent Residential Study & Teaching',
    subtitle: 'Sanskrit, Classical Logic & Philosophy, India',
    date: 'Oct 2021 - Present',
    bullets: [
      'Residential study of Sanskrit grammar, classical logic, epistemology and philosophy.',
      'Teaching and mentoring in logic and philosophy.',
      'AI-assisted Sanskrit-to-English book translation and independent proofreading against original texts.'
    ]
  },
  {
    title: 'Rehive',
    subtitle: 'Senior DevOps Engineer',
    date: 'Aug 2020 - Sep 2021',
    bullets: [
      'Operated infrastructure supporting approximately 1.2 million requests/day',
      'Scaled and maintained GKE clusters and PostgreSQL',
      'Co-managed infrastructure with the CTO',
      'Enhanced custom Python CI/CD tooling',
      'Built Python automation managing 70+ Git repositories',
      'Deployed and configured Prometheus and Grafana monitoring',
      'Planned and organised the DevOps roadmap',
      'Identified infrastructure weaknesses and implemented fixes',
      'Executed cost-optimisation initiatives'
    ]
  },
  {
    title: 'DevOps Consultant / Contractor',
    subtitle: 'Senior DevOps Engineer',
    date: 'Apr 2019 - Dec 2019',
    clients: [
      {
        name: 'Client: SensorNetworks',
        date: 'Oct 2019 - Dec 2019',
        bullets: ['Authored Helm charts', 'Implemented Prometheus & Grafana monitoring solution']
      },
      {
        name: 'Client: Private',
        date: 'Aug 2019 - Sep 2019',
        bullets: ['Migrated a LAMP-stack application from bare-metal servers to AWS']
      },
      {
        name: 'Client: OneConfig',
        date: 'Apr 2019 - Aug 2019',
        bullets: [
          'Managed a fleet of 30+ Linux servers',
          'Provisioned, configured, and migrated servers',
          'Handled patching, backups, monitoring, and incident response',
          "Renewed and managed Let's Encrypt certificates",
          'Operated and maintained a CockroachDB cluster',
          'Implemented automation using Ansible, Bash, and Go',
          'Dockerized the staging environment',
          'Cost optimizations',
          'Provisioned and managed KVM virtual machines'
        ]
      }
    ]
  },
  {
    title: 'Kurtosys',
    subtitle: 'Senior Platform Engineer',
    date: 'Aug 2017 - Mar 2019',
    bullets: [
      'Hybrid role: DevOps and full-stack engineering',
      'One of three platform engineers for the project',
      'Project: Architected and built a highly available, end-to-end WordPress hosting platform',
      'Key Contributions:'
    ],
    subBullets: [
      "Built backend platform services and API's in TypeScript (unit tested)",
      'Architected a multi-environment system (dev, staging, production)',
      'Automated WordPress provisioning and lifecycle management',
      'Implemented CI/CD pipelines and Git workflows per environment',
      'Built high-availability infrastructure using Docker Swarm and GlusterFS',
      'Integrated platform services: DNS, TLS, backups, restores, databases',
      'Optimized and maintained Docker images',
      'Deployed and operated a high-availability internal GitLab service',
      'Automated GitLab provisioning and configuration using Puppet',
      'Tested infrastructure automation with Vagrant',
      'Provisioned and managed cluster components using Ansible'
    ]
  },
  {
    title: 'Manalto',
    subtitle: 'DevOps Engineer',
    date: 'Mar 2017 - Jul 2017',
    bullets: [
      'Deployed and maintained Linux servers',
      'Administrated MongoDB',
      'Managed AWS services and CI/CD pipelines',
      'Containerized staging using Alpine-based Docker images',
      'Built Bitbucket and Jenkins pipelines for the Docker staging environment',
      'Automated AWS Route53 CNAME creation',
      'Wrote init.d scripts and a Docker management script in Bash',
      'Integrated AWS CloudWatch metrics into Grafana dashboards',
      'Deployed private NPM registry'
    ]
  },
  {
    title: 'OLX',
    subtitle: 'DevOps Engineer',
    date: 'Apr 2016 - Jan 2017',
    bullets: [
      'Co-managed six OLX country sites across Africa',
      'olx.co.za alone was receiving millions of pageviews per day',
      'Maintained high-scale Linux servers, MySQL, Redis databases',
      'Deployed Sensu for monitoring and alerting',
      'Deployed ELK stack and created custom dashboards',
      'Automated SSH key provisioning and rotation using Ansible',
      'Bash and Ruby scripting'
    ]
  },
  {
    title: '8Frag',
    subtitle: 'Linux Systems Administrator',
    date: 'Jul 2014 - Apr 2016',
    bullets: [
      'Administered and maintained Ubuntu and Windows servers',
      'Managed AWS services: EC2, S3, Route 53',
      'MySQL database administration',
      'Deployed and configured game servers(CS:GO and TF2)',
      'Migrated game servers between Linux and Windows servers',
      'Tested game servers and software',
      'Deployed and configured UnrealIRC and Teamspeak',
      'Implemented game server web-panel TCAdmin',
      'Deployed and configured monitoring solutions (Pulseway and LibreNMS)',
      'DDOS mitigation with Bash, UFW, IPtables and Apache logs',
      'Wrote tutorials on how to use and manage game servers',
      'Bash scripting and SSL installation',
      'Client support and game tournament support',
      'Managed and trained a Junior Linux Systems Administrator'
    ]
  },
  {
    title: 'Ockhams Razor',
    subtitle: 'Junior Linux Systems Administrator',
    date: 'Feb 2014 - Apr 2014',
    bullets: [
      'Gained hands-on experience with Debian Servers and RAID',
      'Training highlights:',
      'Solid understanding of Linux fundamentals (LPI Level 1)',
      'apt-get package management',
      'Apache web server deployment and configuration',
      'Postfix email server administration and mailflow troubleshooting',
      'Deploying and configuring web sites/panels and ISP config',
      'BASH, AWK, SED and REGEX Scripting',
      'DNS and configuring network interface cards'
    ]
  },
  {
    title: 'Maxitec - Internet Service Provider',
    subtitle: 'Internet and IT Support',
    date: 'Jan 2012 - Jan 2014',
    bullets: [
      'Responded to all calls, e-mails and walk-in clients',
      'Service call outs for resolving hardware, software and end users problems',
      'Provided customer support for all issues relating to',
      'Windows/Apple computers, mobile devices, routers, hosting, e-mails, VOIP',
      'Created and updated support documentation'
    ]
  }
];

export const education = [
  {
    title: 'Red Hat Certified Systems Administrator',
    meta: 'Red Hat',
    date: 'Sep 2015'
  }
];
