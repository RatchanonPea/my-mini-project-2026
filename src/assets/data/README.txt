thai-address.json: Thai provinces / districts / sub-districts with postal codes, used by the address picker.
Compact format: { provinces: [name], districts: [[name, provinceIndex]], subs: [[name, districtIndex, zip]] }
Source: the "thai-data" npm package (ISC licence), itself based on Thailand Post postal codes.
Regenerate by flattening that package's data.json into the format above.
