document.getElementById('zipFileInput').addEventListener('change', async function() {
    const fileInput = this;
    const file = fileInput.files[0];
    const status = document.getElementById('status');
    status.textContent = "처리 중...";

    if (!file) {
        alert("ZIP 파일을 선택해주세요!");
        return;
    }

    try {
        const jszip = new JSZip();
        const zip = await jszip.loadAsync(file);
        const newZip = new JSZip();

        // ZIP 내부 파일 처리
        for (const fileName in zip.files) {
            const zipFile = zip.files[fileName];

            if (zipFile.dir) {
                newZip.folder(fileName);  // 디렉토리는 그대로 추가
            } else {
                const content = zipFile.name.endsWith('.js') 
                    ? await zipFile.async("string")  // JS 파일인 경우 난독화
                    : await zipFile.async("blob");  // 그 외 파일은 그대로 추가

                const obfuscatedCode = zipFile.name.endsWith('.js') 
                    ? obfuscate(content)  // JS 파일 난독화
                    : content;

                newZip.file(fileName, obfuscatedCode);
            }
        }

        // 새로운 ZIP 파일 생성
        const newZipBlob = await newZip.generateAsync({ type: "blob" });
        const downloadUrl = URL.createObjectURL(newZipBlob);

        // 다운로드 링크 생성
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = file.name;  // 원본 파일 이름 그대로 사용
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        status.textContent = "난독화 완료. 다운로드를 시작합니다.";
    } catch (err) {
        console.error(err);
        alert(`처리 중 오류가 발생했습니다: ${err.message}`);
        status.textContent = "오류 발생";
    }
});

function obfuscate(jsCode) {
    const obfuscationOptions = {
        identifierNamesGenerator: 'mangled', // 변수 이름을 간단한 알파벳 조합으로 변경
        renameGlobals: false, // 전역 변수 이름 변경 비활성화
        compact: false, // 코드 압축 비활성화
        stringArray: false, // 문자열 배열화 비활성화
        stringArrayEncoding: [], // 문자열 인코딩 설정을 비활성화
        stringArrayThreshold: 0, // 문자열 배열화 사용 안 함
        transformObjectKeys: false, // 객체 키 변경 비활성화
        reservedNames: ['^id$', '^class$', '^type$'], // 'id', 'class', 'type'은 보호
        controlFlowFlattening: false, // 흐름 평탄화 비활성화
        deadCodeInjection: false, // 죽은 코드 삽입 비활성화
        preserveLineBreaks: true // 줄바꿈 유지
    };

    const obfuscatedCode = window.JavaScriptObfuscator.obfuscate(jsCode, obfuscationOptions).getObfuscatedCode();

    return obfuscatedCode;
}