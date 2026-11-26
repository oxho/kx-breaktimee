{
  "targets": [
    {
      "target_name": "focusassist",
      "sources": [],
      "cflags!": [
        "-fno-exceptions"
      ],
      "cflags_cc!": [
        "-fno-exceptions"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "conditions": [
        [
          "OS==\"win\"",
          {
            "sources": [
              "lib/focus-assist.cc"
            ],
            "dependencies": [
              "focusassist_quiet_hours_guids"
            ],
            "msvs_settings": {
              "VCCLCompilerTool": {
                "AdditionalOptions": [
                  "/std:c++20",
                  "/utf-8"
                ],
                "AdditionalOptions!": [
                  "-std:c++17"
                ]
              }
            }
          }
        ]
      ]
    }
  ],
  "conditions": [
    [
      "OS==\"win\"",
      {
        "targets": [
          {
            "target_name": "focusassist_quiet_hours_guids",
            "type": "static_library",
            "sources": [
              "lib/quiethours_i.c"
            ]
          }
        ]
      }
    ]
  ]
}
