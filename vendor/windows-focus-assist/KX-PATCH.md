# Windows native build

This product ships windows-focus-assist 1.4.0, Copyright Jan Hannemann, under the adjacent MIT license. The Windows build uses the original shipped MIDL-generated header and GUID source. It omits the redundant IDL compilation step, which fails with MIDL2020 in Unicode workspaces. The C++ module receives /utf-8 and /std:c++20. The generated GUID file is compiled separately as C. The Focus Assist implementation is unchanged.
