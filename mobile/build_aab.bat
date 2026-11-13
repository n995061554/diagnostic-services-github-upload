@echo off
set GRADLE_USER_HOME=D:\.gradle
set TEMP=D:\temp
set TMP=D:\temp
set _JAVA_OPTIONS=-Djava.io.tmpdir=D:\temp
set JAVA_TOOL_OPTIONS=-Djava.io.tmpdir=D:\temp
set PATH=D:\flutter_windows_3.47.6-stable\flutter\bin;%PATH%

cd /d D:\diagnostic-services\mobile

echo === Building Release AAB ===
call flutter build appbundle --release --android-skip-build-dependency-validation --dart-define=API_BASE_URL=https://staging-api.diagnosticservices.internal
