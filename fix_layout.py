with open('e:/Freelance/btr-admin-panel/src/components/layout/AdminLayout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """               <NavLink
                to="/portfolio"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                </button>"""

replacement = """               <NavLink
                to="/portfolio"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                activeClassName="bg-muted font-medium"
              >
                <span className="text-muted-foreground">💬</span>
                Portfolio
              </NavLink> 

              <NavLink
                to="/leads"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                activeClassName="bg-muted font-medium"
              >
                <span className="text-muted-foreground">💬</span>
                Leads Management
              </NavLink> 
              <NavLink
                to="/pricing"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                activeClassName="bg-muted font-medium"
              >
                <span className="text-muted-foreground">💬</span>
                Pricing
              </NavLink> 
              <NavLink
                to="/chat-config"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                activeClassName="bg-muted font-medium"
              >
                <span className="text-muted-foreground">🤖</span>
                Chat Assistant
              </NavLink>

              {/* Home section */}
              <div className="pt-4">
                <button
                  onClick={() => setHomeExpanded(!homeExpanded)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <span className="font-medium">Home</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      homeExpanded && "rotate-180"
                    )}
                  />
                </button>"""

if target in content:
    content = content.replace(target, replacement)
    with open('e:/Freelance/btr-admin-panel/src/components/layout/AdminLayout.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed AdminLayout')
else:
    print('Target not found')
