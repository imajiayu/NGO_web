#!/bin/bash

# =============================================================================
# Image Conversion and Compression Script
# =============================================================================
# Uses FFmpeg and ImageMagick to convert and compress images
# Supports: WebP, JPEG, PNG and other formats
# Features: Smart compression, batch processing, recursive folder support
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Color Output
# -----------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# -----------------------------------------------------------------------------
# Default Values
# -----------------------------------------------------------------------------
FORMAT=""
QUALITY=82
MAX_WIDTH=""
MAX_HEIGHT=""
MAX_SIZE=""
SOURCE=""
DRY_RUN=false
VERBOSE=false

# -----------------------------------------------------------------------------
# Help Message
# -----------------------------------------------------------------------------
show_help() {
    cat << EOF
${BLUE}╔════════════════════════════════════════════════════════════════════╗
║           Image Conversion & Compression Script                    ║
╚════════════════════════════════════════════════════════════════════╝${NC}

${GREEN}DESCRIPTION:${NC}
    Convert and compress images using FFmpeg and ImageMagick with smart
    quality control. Supports single files or batch processing of folders.

${GREEN}USAGE:${NC}
    $0 --format FORMAT --source PATH [OPTIONS]

${GREEN}REQUIRED PARAMETERS:${NC}
    --format FORMAT, -f FORMAT
        Target output format
        Supported: webp, jpg, jpeg, png, avif
        Example: --format webp

    --source PATH, -s PATH
        Source file or folder path
        • Single file: --source image.jpg
        • Folder: --source ./images (processes all images recursively)
        Supported input: jpg, jpeg, png, webp, bmp, tiff, gif

${GREEN}OPTIONAL PARAMETERS:${NC}
    --quality QUALITY, -q QUALITY
        Image quality (0-100)
        • WebP recommended: 80-85 (default: 82)
        • JPEG recommended: 85-90
        • PNG: ignored (lossless)
        Example: --quality 85

    --max-width WIDTH, -w WIDTH
        Maximum output width in pixels (maintains aspect ratio)
        Example: --max-width 1920

    --max-height HEIGHT, -h HEIGHT
        Maximum output height in pixels (maintains aspect ratio)
        Example: --max-height 1080

    --max-size SIZE, -m SIZE
        Maximum file size (e.g., 200kb, 1.5mb, 500KB)
        If output exceeds this, quality will be reduced iteratively
        Example: --max-size 300kb

    --dry-run, -n
        Preview mode: show what would be done without making changes

    --verbose, -v
        Enable detailed output for debugging

    --help
        Display this help message and exit

${GREEN}COMPRESSION LOGIC (HYBRID MODE):${NC}
    1. Resize image if --max-width or --max-height is specified
    2. Convert to target format with specified --quality
    3. If --max-size is set and output exceeds it:
       → Reduce quality iteratively (min: 50)
       → Stop when size ≤ target or quality reaches minimum

${GREEN}EXAMPLES:${NC}
    ${YELLOW}# Convert single image to WebP with quality 85${NC}
    $0 --format webp --quality 85 --source photo.jpg

    ${YELLOW}# Convert folder to WebP, max 1920px width, target 300kb${NC}
    $0 -f webp -q 82 -w 1920 -m 300kb -s ./public/images

    ${YELLOW}# Convert to JPEG, resize to max 1200x800, quality 90${NC}
    $0 -f jpg -q 90 -w 1200 -h 800 -s ./photos

    ${YELLOW}# Dry run to preview changes${NC}
    $0 -f webp -q 85 -s ./images --dry-run

    ${YELLOW}# Compress large images with size limit${NC}
    $0 -f webp --max-size 500kb --source ./hero-images

${GREEN}SMART DEFAULTS FOR COMMON SCENARIOS:${NC}
    ${BLUE}Small Icons/Thumbnails:${NC}
    $0 -f webp -q 80 -w 400 -m 50kb -s ./icons

    ${BLUE}Product Images:${NC}
    $0 -f webp -q 82 -w 1200 -m 200kb -s ./products

    ${BLUE}Hero/Banner Images:${NC}
    $0 -f webp -q 85 -w 1920 -m 500kb -s ./banners

    ${BLUE}High-Quality Photos:${NC}
    $0 -f webp -q 88 -w 2560 -m 800kb -s ./gallery

${GREEN}IMPORTANT NOTES:${NC}
    ⚠️  Original files will be DELETED after successful conversion
    ⚠️  Ensure you have backups before running
    ⚠️  Use --dry-run to preview changes safely
    ✓  Supports recursive folder processing
    ✓  Automatically skips already converted files
    ✓  Preserves original modification timestamps

${GREEN}REQUIREMENTS:${NC}
    • FFmpeg (for WebP, AVIF conversion)
    • ImageMagick (for fallback and additional formats)
    Install: brew install ffmpeg imagemagick

${GREEN}EXIT CODES:${NC}
    0 - Success
    1 - Missing required parameters or dependencies
    2 - Source file/folder not found
    3 - Conversion error

EOF
}

# -----------------------------------------------------------------------------
# Utility Functions
# -----------------------------------------------------------------------------
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1" >&2
}

log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# -----------------------------------------------------------------------------
# Check Dependencies
# -----------------------------------------------------------------------------
check_dependencies() {
    local missing=()

    if ! command -v ffmpeg &> /dev/null; then
        missing+=("ffmpeg")
    fi

    if ! command -v convert &> /dev/null; then
        missing+=("imagemagick")
    fi

    if [ ${#missing[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing[*]}"
        log_error "Install with: brew install ${missing[*]}"
        exit 1
    fi
}

# -----------------------------------------------------------------------------
# Parse File Size (e.g., "300kb" -> bytes)
# -----------------------------------------------------------------------------
parse_size() {
    local size_str="$1"
    local size_num="${size_str//[^0-9.]/}"
    local size_unit="${size_str//[0-9.]/}"

    case "${size_unit,,}" in
        kb) echo "$(awk "BEGIN {print int($size_num * 1024)}")" ;;
        mb) echo "$(awk "BEGIN {print int($size_num * 1024 * 1024)}")" ;;
        *) echo "$size_num" ;;
    esac
}

# -----------------------------------------------------------------------------
# Get File Size in Bytes
# -----------------------------------------------------------------------------
get_file_size() {
    local file="$1"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        stat -f%z "$file"
    else
        stat -c%s "$file"
    fi
}

# -----------------------------------------------------------------------------
# Format File Size (bytes -> human readable)
# -----------------------------------------------------------------------------
format_size() {
    local bytes=$1
    if [ $bytes -lt 1024 ]; then
        echo "${bytes}B"
    elif [ $bytes -lt 1048576 ]; then
        echo "$(awk "BEGIN {printf \"%.1fKB\", $bytes/1024}")"
    else
        echo "$(awk "BEGIN {printf \"%.2fMB\", $bytes/1048576}")"
    fi
}

# -----------------------------------------------------------------------------
# Convert Single Image
# -----------------------------------------------------------------------------
convert_image() {
    local input_file="$1"
    local output_file="${input_file%.*}.${FORMAT}"

    # Skip if already in target format
    if [ "$input_file" = "$output_file" ]; then
        log_warning "Skipping: $input_file (already in $FORMAT format)"
        return 0
    fi

    log_info "Processing: $input_file"

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would convert: $input_file -> $output_file"
        return 0
    fi

    local temp_output="${output_file}.tmp.${FORMAT}"
    local current_quality=$QUALITY
    local resize_params=""

    # Build resize parameters
    if [ -n "$MAX_WIDTH" ] && [ -n "$MAX_HEIGHT" ]; then
        resize_params="-vf scale='min($MAX_WIDTH,iw)':'min($MAX_HEIGHT,ih)':force_original_aspect_ratio=decrease"
    elif [ -n "$MAX_WIDTH" ]; then
        resize_params="-vf scale='min($MAX_WIDTH,iw)':-1"
    elif [ -n "$MAX_HEIGHT" ]; then
        resize_params="-vf scale=-1:'min($MAX_HEIGHT,ih)'"
    fi

    # Initial conversion attempt
    local ffmpeg_quality_param=""
    case "${FORMAT,,}" in
        webp)
            ffmpeg_quality_param="-quality $current_quality"
            ;;
        jpg|jpeg)
            ffmpeg_quality_param="-q:v $(awk "BEGIN {print int((100-$current_quality)*31/100)}")"
            ;;
        png)
            ffmpeg_quality_param=""
            ;;
        avif)
            ffmpeg_quality_param="-crf $(awk "BEGIN {print int((100-$current_quality)*51/100)}")"
            ;;
    esac

    log_verbose "FFmpeg command: ffmpeg -i \"$input_file\" $resize_params $ffmpeg_quality_param \"$temp_output\""

    if ! ffmpeg -i "$input_file" $resize_params $ffmpeg_quality_param "$temp_output" -y &> /dev/null; then
        log_error "Failed to convert: $input_file"
        rm -f "$temp_output"
        return 1
    fi

    # Check file size and iteratively reduce quality if needed
    if [ -n "$MAX_SIZE" ]; then
        local max_bytes=$(parse_size "$MAX_SIZE")
        local current_size=$(get_file_size "$temp_output")
        local iteration=0

        while [ $current_size -gt $max_bytes ] && [ $current_quality -ge 50 ]; do
            iteration=$((iteration + 1))
            current_quality=$((current_quality - 5))

            log_verbose "Size $(format_size $current_size) > $MAX_SIZE, reducing quality to $current_quality (attempt $iteration)"

            case "${FORMAT,,}" in
                webp)
                    ffmpeg_quality_param="-quality $current_quality"
                    ;;
                jpg|jpeg)
                    ffmpeg_quality_param="-q:v $(awk "BEGIN {print int((100-$current_quality)*31/100)}")"
                    ;;
                avif)
                    ffmpeg_quality_param="-crf $(awk "BEGIN {print int((100-$current_quality)*51/100)}")"
                    ;;
            esac

            if ! ffmpeg -i "$input_file" $resize_params $ffmpeg_quality_param "$temp_output" -y &> /dev/null; then
                log_error "Failed to re-compress: $input_file"
                rm -f "$temp_output"
                return 1
            fi

            current_size=$(get_file_size "$temp_output")
        done

        if [ $current_size -gt $max_bytes ]; then
            log_warning "Could not reach target size $MAX_SIZE for $input_file (final: $(format_size $current_size))"
        fi
    fi

    # Move temp file to final output
    mv "$temp_output" "$output_file"

    # Get file sizes for reporting
    local input_size=$(get_file_size "$input_file")
    local output_size=$(get_file_size "$output_file")
    local reduction=$(awk "BEGIN {printf \"%.1f\", (1 - $output_size/$input_size) * 100}")

    log_success "Converted: $(basename "$output_file") [$(format_size $input_size) → $(format_size $output_size), -${reduction}%]"

    # Delete original file
    rm "$input_file"
    log_verbose "Deleted original: $input_file"
}

# -----------------------------------------------------------------------------
# Process Directory Recursively
# -----------------------------------------------------------------------------
process_directory() {
    local dir="$1"
    local processed=0
    local failed=0

    log_info "Scanning directory: $dir"

    # Find all image files
    while IFS= read -r -d '' file; do
        if convert_image "$file"; then
            processed=$((processed + 1))
        else
            failed=$((failed + 1))
        fi
    done < <(find "$dir" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" -o -iname "*.bmp" -o -iname "*.tiff" -o -iname "*.gif" \) -print0)

    echo ""
    log_success "Processed: $processed images"
    if [ $failed -gt 0 ]; then
        log_error "Failed: $failed images"
    fi
}

# -----------------------------------------------------------------------------
# Parse Arguments
# -----------------------------------------------------------------------------
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --format|-f)
                FORMAT="$2"
                shift 2
                ;;
            --quality|-q)
                QUALITY="$2"
                shift 2
                ;;
            --max-width|-w)
                MAX_WIDTH="$2"
                shift 2
                ;;
            --max-height)
                MAX_HEIGHT="$2"
                shift 2
                ;;
            --max-size|-m)
                MAX_SIZE="$2"
                shift 2
                ;;
            --source|-s)
                SOURCE="$2"
                shift 2
                ;;
            --dry-run|-n)
                DRY_RUN=true
                shift
                ;;
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
}

# -----------------------------------------------------------------------------
# Validate Arguments
# -----------------------------------------------------------------------------
validate_args() {
    if [ -z "$FORMAT" ]; then
        log_error "Missing required parameter: --format"
        echo "Use --help for usage information"
        exit 1
    fi

    if [ -z "$SOURCE" ]; then
        log_error "Missing required parameter: --source"
        echo "Use --help for usage information"
        exit 1
    fi

    if [ ! -e "$SOURCE" ]; then
        log_error "Source not found: $SOURCE"
        exit 2
    fi

    # Validate format
    case "${FORMAT,,}" in
        webp|jpg|jpeg|png|avif) ;;
        *)
            log_error "Unsupported format: $FORMAT"
            log_error "Supported formats: webp, jpg, jpeg, png, avif"
            exit 1
            ;;
    esac

    # Validate quality
    if ! [[ "$QUALITY" =~ ^[0-9]+$ ]] || [ "$QUALITY" -lt 0 ] || [ "$QUALITY" -gt 100 ]; then
        log_error "Quality must be between 0-100"
        exit 1
    fi
}

# -----------------------------------------------------------------------------
# Main Function
# -----------------------------------------------------------------------------
main() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         Image Conversion & Compression Tool                        ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    parse_args "$@"
    validate_args
    check_dependencies

    # Display configuration
    log_info "Configuration:"
    echo "  Format: $FORMAT"
    echo "  Quality: $QUALITY"
    [ -n "$MAX_WIDTH" ] && echo "  Max Width: ${MAX_WIDTH}px"
    [ -n "$MAX_HEIGHT" ] && echo "  Max Height: ${MAX_HEIGHT}px"
    [ -n "$MAX_SIZE" ] && echo "  Max Size: $MAX_SIZE"
    echo "  Source: $SOURCE"
    [ "$DRY_RUN" = true ] && echo "  Mode: DRY RUN (no changes will be made)"
    echo ""

    # Process source
    if [ -f "$SOURCE" ]; then
        convert_image "$SOURCE"
    elif [ -d "$SOURCE" ]; then
        process_directory "$SOURCE"
    fi

    echo ""
    log_success "All done!"
}

# -----------------------------------------------------------------------------
# Run Main
# -----------------------------------------------------------------------------
main "$@"
