export function createDesktopIconTemplate({
    modalTarget,
    className = "",
    image,
    name,
    attrs = ""
}) {
    return `
<div data-modal="${modalTarget}"
     class="desktop-icon ${className}">

    <img src="${image}"
         ${attrs}
         alt="${name}_icon">

    <div class="desktop-icon-label">
        <span>${name}</span>
    </div>
</div>
`;
}
