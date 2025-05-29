#!/bin/bash
# - Ultimate Chrome Extension Template Initialization Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ASCII Art Logo
print_logo() {
    echo -e "${BLUE}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 ULTIMATE CHROME EXTENSION TEMPLATE                       ║
║                                                               ║
║   The most comprehensive Chrome Extension starter template    ║
║   with React, TypeScript, Supabase, and Stripe              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Function to print colored messages
print_message() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    echo -e "\n${BLUE}Checking prerequisites...${NC}\n"

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    else
        NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
        if [ "$NODE_VERSION" -lt 18 ]; then
            print_error "Node.js version must be 18 or higher. Current version: $(node -v)"
            exit 1
        fi
        print_message "Node.js $(node -v) detected"
    fi

    # Check package manager
    if command -v pnpm &> /dev/null; then
        PACKAGE_MANAGER="pnpm"
        print_message "pnpm detected (recommended)"
    elif command -v npm &> /dev/null; then
        PACKAGE_MANAGER="npm"
        print_warning "npm detected. Consider installing pnpm for better performance: npm install -g pnpm"
    else
        print_error "No package manager found. Please install npm or pnpm."
        exit 1
    fi

    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git."
        exit 1
    else
        print_message "Git detected"
    fi
}

# Get project information
get_project_info() {
    echo -e "\n${BLUE}Project Setup${NC}\n"

    # Project name
    read -p "Enter your extension name (e.g., my-awesome-extension): " PROJECT_NAME
    if [ -z "$PROJECT_NAME" ]; then
        PROJECT_NAME="my-chrome-extension"
    fi
    PROJECT_NAME=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g')

    # Display name
    read -p "Enter display name (e.g., My Awesome Extension): " DISPLAY_NAME
    if [ -z "$DISPLAY_NAME" ]; then
        DISPLAY_NAME="My Chrome Extension"
    fi

    # Description
    read -p "Enter description: " DESCRIPTION
    if [ -z "$DESCRIPTION" ]; then
        DESCRIPTION="A powerful Chrome extension built with modern web technologies"
    fi

    # Author
    read -p "Enter author name: " AUTHOR_NAME
    if [ -z "$AUTHOR_NAME" ]; then
        AUTHOR_NAME="Your Name"
    fi

    read -p "Enter author email: " AUTHOR_EMAIL
    if [ -z "$AUTHOR_EMAIL" ]; then
        AUTHOR_EMAIL="your.email@example.com"
    fi

    # Features selection
    echo -e "\n${BLUE}Select features to include:${NC}"
    read -p "Include Supabase authentication? (Y/n): " INCLUDE_SUPABASE
    INCLUDE_SUPABASE=${INCLUDE_SUPABASE:-Y}

    read -p "Include Stripe payments? (Y/n): " INCLUDE_STRIPE
    INCLUDE_STRIPE=${INCLUDE_STRIPE:-Y}

    read -p "Include analytics? (Y/n): " INCLUDE_ANALYTICS
    INCLUDE_ANALYTICS=${INCLUDE_ANALYTICS:-Y}

    # Confirm
    echo -e "\n${BLUE}Configuration Summary:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Project name: $PROJECT_NAME"
    echo "Display name: $DISPLAY_NAME"
    echo "Description: $DESCRIPTION"
    echo "Author: $AUTHOR_NAME <$AUTHOR_EMAIL>"
    echo "Supabase: $([ "$INCLUDE_SUPABASE" = "Y" ] && echo "✓" || echo "✗")"
    echo "Stripe: $([ "$INCLUDE_STRIPE" = "Y" ] && echo "✓" || echo "✗")"
    echo "Analytics: $([ "$INCLUDE_ANALYTICS" = "Y" ] && echo "✓" || echo "✗")"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    read -p $'\nProceed with this configuration? (Y/n): ' CONFIRM
    CONFIRM=${CONFIRM:-Y}
    if [ "$CONFIRM" != "Y" ] && [ "$CONFIRM" != "y" ]; then
        echo "Setup cancelled."
        exit 0
    fi
}

# Clone template
clone_template() {
    echo -e "\n${BLUE}Creating project...${NC}\n"

    # Clone from template (you'll need to replace with your actual template URL)
    TEMPLATE_URL="https://github.com/maemreyo/ultimate-chrome-extension.git"

    if [ -d "$PROJECT_NAME" ]; then
        print_error "Directory $PROJECT_NAME already exists!"
        exit 1
    fi

    print_message "Cloning template..."
    git clone --depth 1 "$TEMPLATE_URL" "$PROJECT_NAME" || {
        print_error "Failed to clone template. Using local copy instead..."
        cp -r "$(dirname "$0")" "$PROJECT_NAME"
    }

    cd "$PROJECT_NAME"

    # Remove git history
    rm -rf .git
    git init
    print_message "Initialized new git repository"
}

# Customize project
customize_project() {
    echo -e "\n${BLUE}Customizing project...${NC}\n"

    # Update package.json
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/\"name\": \"ultimate-chrome-extension\"/\"name\": \"$PROJECT_NAME\"/" package.json
        sed -i '' "s/\"displayName\": \"Ultimate Chrome Extension\"/\"displayName\": \"$DISPLAY_NAME\"/" package.json
        sed -i '' "s/\"description\": \".*\"/\"description\": \"$DESCRIPTION\"/" package.json
        sed -i '' "s/\"author\": \".*\"/\"author\": \"$AUTHOR_NAME <$AUTHOR_EMAIL>\"/" package.json
    else
        # Linux
        sed -i "s/\"name\": \"ultimate-chrome-extension\"/\"name\": \"$PROJECT_NAME\"/" package.json
        sed -i "s/\"displayName\": \"Ultimate Chrome Extension\"/\"displayName\": \"$DISPLAY_NAME\"/" package.json
        sed -i "s/\"description\": \".*\"/\"description\": \"$DESCRIPTION\"/" package.json
        sed -i "s/\"author\": \".*\"/\"author\": \"$AUTHOR_NAME <$AUTHOR_EMAIL>\"/" package.json
    fi

    # Remove features if not selected
    if [ "$INCLUDE_SUPABASE" != "Y" ] && [ "$INCLUDE_SUPABASE" != "y" ]; then
        print_message "Removing Supabase integration..."
        rm -rf src/core/supabase.ts
        rm -rf src/hooks/useSupabaseAuth.ts
        rm -rf supabase/
        rm -rf src/background/messages/supabase.ts
        # Remove Supabase dependencies from package.json
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        delete pkg.dependencies['@supabase/supabase-js'];
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        "
    fi

    if [ "$INCLUDE_STRIPE" != "Y" ] && [ "$INCLUDE_STRIPE" != "y" ]; then
        print_message "Removing Stripe integration..."
        rm -rf src/core/stripe.ts
        rm -rf src/tabs/pricing.tsx
        rm -rf api/stripe/
        rm -rf src/background/messages/stripe.ts
        # Remove Stripe dependencies from package.json
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        delete pkg.dependencies['@stripe/stripe-js'];
        delete pkg.dependencies['stripe'];
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        "
    fi

    # Create .env files
    print_message "Creating environment files..."
    cat > .env.example << EOF
# Supabase
PLASMO_PUBLIC_SUPABASE_URL=your_supabase_url
PLASMO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
PLASMO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# API
PLASMO_PUBLIC_API_URL=http://localhost:3000

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id

# Extension
CRX_PUBLIC_KEY=your_extension_public_key

# Analytics
PLASMO_PUBLIC_GA_MEASUREMENT_ID=your_ga_measurement_id

# Sentry (Error Tracking)
PLASMO_PUBLIC_SENTRY_DSN=your_sentry_dsn
EOF

    cp .env.example .env.development
    cp .env.example .env.production

    print_message "Project customized successfully!"
}

# Install dependencies
install_dependencies() {
    echo -e "\n${BLUE}Installing dependencies...${NC}\n"

    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        pnpm install
    else
        npm install
    fi

    print_message "Dependencies installed!"
}

# Generate assets
generate_assets() {
    echo -e "\n${BLUE}Generating assets...${NC}\n"

    # Create assets directory
    mkdir -p assets

    # Generate placeholder icons
    for size in 16 48 128; do
        cat > "assets/icon-${size}.png" << EOF
# Placeholder for ${size}x${size} icon
# Replace with your actual icon
EOF
    done

    print_message "Asset placeholders created!"
}

# Setup git hooks
setup_git_hooks() {
    echo -e "\n${BLUE}Setting up git hooks...${NC}\n"

    npx husky install
    npx husky add .husky/pre-commit "npx lint-staged"

    print_message "Git hooks configured!"
}

# Final instructions
print_final_instructions() {
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Extension created successfully!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    echo -e "\n${BLUE}Next steps:${NC}\n"
    echo "1. Navigate to your project:"
    echo "   ${YELLOW}cd $PROJECT_NAME${NC}"
    echo ""
    echo "2. Update environment variables:"
    echo "   ${YELLOW}cp .env.example .env.development${NC}"
    echo "   ${YELLOW}code .env.development${NC}"
    echo ""
    echo "3. Add your extension icons:"
    echo "   - assets/icon-16.png (16x16)"
    echo "   - assets/icon-48.png (48x48)"
    echo "   - assets/icon-128.png (128x128)"
    echo ""
    echo "4. Start development:"
    echo "   ${YELLOW}$PACKAGE_MANAGER run dev${NC}"
    echo ""
    echo "5. Load extension in Chrome:"
    echo "   - Open ${YELLOW}chrome://extensions/${NC}"
    echo "   - Enable Developer mode"
    echo "   - Click 'Load unpacked'"
    echo "   - Select ${YELLOW}build/chrome-mv3-dev${NC} folder"
    echo ""
    echo -e "${BLUE}📚 Documentation:${NC} https://github.com/maemreyo/ultimate-chrome-extension"
    echo -e "${BLUE}💬 Discord:${NC} https://discord.gg/yourcommunity"
    echo ""
    echo -e "${GREEN}Happy coding! 🚀${NC}"
}

# Main execution
main() {
    clear
    print_logo
    check_prerequisites
    get_project_info
    clone_template
    customize_project
    install_dependencies
    generate_assets
    setup_git_hooks
    print_final_instructions
}

# Run main function
main
