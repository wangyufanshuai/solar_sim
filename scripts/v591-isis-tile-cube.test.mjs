import { describe, expect, it } from "vitest";

import {
  analyzeDecodedCube,
  decodeUnsignedByteTiledCube,
  parseIsisTiledCubeLayout,
} from "./lib/v591-isis-tile-cube.mjs";

const header = `
Object = IsisCube
  Object = Core
    StartByte = 129
    Format = Tile
    TileSamples = 2
    TileLines = 1
    Group = Dimensions
      Samples = 4
      Lines = 2
      Bands = 3
    End_Group
    Group = Pixels
      Type = UnsignedByte
      ByteOrder = Lsb
      Base = 0.0
      Multiplier = 1.0
    End_Group
  End_Object
  Group = Instrument
    TargetName = Venus
  End_Group
  Group = Mapping
    ProjectionName = Equirectangular
    LongitudeDirection = PositiveEast
    LongitudeDomain = 180
    MinimumLatitude = -90.0
    MaximumLatitude = 90.0
    MinimumLongitude = -180.0
    MaximumLongitude = 180.0
  End_Group
End_Object
`;

describe("v591 ISIS tiled cube decoder", () => {
  it("parses the locked Venus equirectangular unsigned-byte contract", () => {
    const layout = parseIsisTiledCubeLayout(header);
    expect(layout).toMatchObject({
      startByte: 129,
      format: "Tile",
      tileSamples: 2,
      tileLines: 1,
      samples: 4,
      lines: 2,
      bands: 3,
      projectionName: "Equirectangular",
      longitudeDirection: "PositiveEast",
    });
  });

  it("decodes band-major, row-major tiles into interleaved RGB without tile seams", () => {
    const layout = parseIsisTiledCubeLayout(header);
    const cube = Buffer.alloc(128 + 24);
    const tiles = [
      [1, 2], [3, 4], [5, 6], [7, 8],
      [11, 12], [13, 14], [15, 16], [17, 18],
      [21, 22], [23, 24], [25, 26], [27, 28],
    ];
    tiles.forEach((tile, index) => Buffer.from(tile).copy(cube, 128 + index * 2));
    const decoded = decodeUnsignedByteTiledCube(cube, layout);
    expect([...decoded.pixels]).toEqual([
      1, 11, 21, 2, 12, 22, 3, 13, 23, 4, 14, 24,
      5, 15, 25, 6, 16, 26, 7, 17, 27, 8, 18, 28,
    ]);
    expect(decoded).toMatchObject({ tilesX: 2, tilesY: 2, coreOffset: 128, coreByteLength: 24 });
    expect(analyzeDecodedCube(decoded.pixels, layout).channelMean).toEqual([4.5, 14.5, 24.5]);
  });

  it("rejects truncated core bytes and non-Venus targets", () => {
    const layout = parseIsisTiledCubeLayout(header);
    expect(() => decodeUnsignedByteTiledCube(Buffer.alloc(151), layout)).toThrow(/v591-isis-core-bounds/);
    expect(() => parseIsisTiledCubeLayout(header.replace("Venus", "Mars"))).toThrow(/v591-isis-target/);
  });
});

