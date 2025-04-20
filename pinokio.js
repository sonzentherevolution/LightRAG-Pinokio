module.exports = {
  title: "LightRAG",
  description: "Simple and Fast Retrieval-Augmented Generation with Knowledge Graph Support",
  icon: "icon.png",
  menu: [
    {
      text: "Install",
      href: "install.js"
    },
    {
      text: "Start Server",
      href: "start.js"
    },
    {
      text: "Open WebUI",
      href: "{{local.url}}",
      when: "{{local.url}}"
    },
    {
      text: "Configure",
      href: "configure"
    }
  ]
} 